import { useEffect, useRef, useState } from 'react'

const TILE = 100
const HEAD_SIZE = TILE * 1.7
const interpolateWrapped = (from, to, progress, dimension) => {
    let delta = to - from
    if (delta > dimension / 2) delta -= dimension
    else if (delta < -dimension / 2) delta += dimension
    return from + delta * progress
}

const getWrappedOffsets = (min, max, dimension, margin) => {
    const offsets = [0]
    if (min - margin < 0) offsets.push(dimension)
    if (max + margin > dimension) offsets.push(-dimension)
    return offsets
}

const roundedRectPath = (context, x, y, width, height, radius) => {
    const r = Math.min(radius, width / 2, height / 2)
    context.beginPath()
    context.moveTo(x + r, y)
    context.arcTo(x + width, y, x + width, y + height, r)
    context.arcTo(x + width, y + height, x, y + height, r)
    context.arcTo(x, y + height, x, y, r)
    context.arcTo(x, y, x + width, y, r)
    context.closePath()
}

const formatElapsedTime = milliseconds => {
    const totalSeconds = Math.floor(milliseconds / 1000)
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60

    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

const GameHud = ({ statsRef }) => {
    const [stats, setStats] = useState({ score: 0, elapsedMs: 0, speed: 500 })

    useEffect(() => {
        const updateStats = () => {
            setStats({ ...statsRef.current })
        }
        const interval = setInterval(updateStats, 200)

        return () => clearInterval(interval)
    }, [statsRef])

    return (
        <div className="game-hud" aria-label="Current round stats">
            <div className="game-hud__stat">
                <span className="game-hud__label">Time</span>
                <strong className="game-hud__value">{formatElapsedTime(stats.elapsedMs)}</strong>
            </div>
            <div className="game-hud__stat">
                <span className="game-hud__label">Score</span>
                <strong className="game-hud__value">{stats.score}</strong>
            </div>
            <div className="game-hud__stat">
                <span className="game-hud__label">Speed</span>
                <strong className="game-hud__value">{(1000 / stats.speed).toFixed(1)} tiles/s</strong>
            </div>
        </div>
    )
}

// lägg till hicgscore och koppla till api

const Canvas = props => {
    const ref = useRef()
    const pos = useRef({ x: 0, y: 0 })
    const history = useRef([])
    const sizeCount = useRef(3)
    const rewardPos = useRef({ x: 0, y: 0 })
    const trapPos = useRef({ x: 0, y: 0 })
    const direction = useRef({right: true, left: false, up: false, down: false})
    const currentHeading = useRef("right")
    const speed = useRef(500)
    const roundStats = useRef({
        score: 0,
        elapsedMs: 0,
        running: false,
        lastFrameTimestamp: null,
        speed: 500,
    })

    const baseImg = useRef(null)
    const baseRewardImg = useRef(null)
    const trapImg = useRef(null)

    const bgMusic = useRef(null)
    const gameOverMusic = useRef(null)
    const rewardMusic = useRef(null)
    const trapMusic = useRef(null)

    const audioSpeedMulti = useRef(1)

    let context = useRef(null)

    const isPaused = useRef(false)
    const intervalRef = useRef(null)
    const animationFrameRef = useRef(null)
    const lastMoveAt = useRef(null)
    const frameTime = useRef(null)

    useEffect(() => {
        const base = import.meta.env.BASE_URL;

        bgMusic.current = new Audio(`${import.meta.env.BASE_URL}sound/Jannie.wav`)
        bgMusic.current.loop = true
        bgMusic.current.volume = 0.2

        gameOverMusic.current = new Audio(`${import.meta.env.BASE_URL}sound/game-over.mp3`)
        gameOverMusic.current.volume = 0.4

        rewardMusic.current = new Audio(`${import.meta.env.BASE_URL}sound/reward.mp3`)
        rewardMusic.current.volume = 0.4

        trapMusic.current = new Audio(`${import.meta.env.BASE_URL}sound/trap.mp3`)
        trapMusic.current.volume = 0.4

        baseImg.current = new Image()
        baseImg.current.src = `${base}img/jannie2.png`;

        baseRewardImg.current = new Image()
        baseRewardImg.current.src = `${base}img/drink.png`;

        trapImg.current = new Image()
        trapImg.current.src = `${base}img/coffe.png`;

        const canvas = ref.current
        context = canvas.getContext("2d")
        drawWelcomeScreen()

        return () => {
            clearInterval(intervalRef.current)
            cancelAnimationFrame(animationFrameRef.current)
        }
    }, [])

    function stopAnimation() {
        cancelAnimationFrame(animationFrameRef.current)
        animationFrameRef.current = null
    }

    function animate(timestamp) {
        if (isPaused.current || !intervalRef.current) return

        frameTime.current = timestamp
        if (roundStats.current.running) {
            if (roundStats.current.lastFrameTimestamp !== null) {
                roundStats.current.elapsedMs += timestamp - roundStats.current.lastFrameTimestamp
            }
            roundStats.current.lastFrameTimestamp = timestamp
        }
        if (lastMoveAt.current === null) lastMoveAt.current = timestamp
        const progress = Math.min((timestamp - lastMoveAt.current) / speed.current, 1)
        draw(context, progress)
        animationFrameRef.current = requestAnimationFrame(animate)
    }

    function startAnimation() {
        if (animationFrameRef.current === null) {
            animationFrameRef.current = requestAnimationFrame(animate)
        }
    }

    function togglePause() {
        if (!intervalRef.current) return

        if (isPaused.current) {
            bgMusic.current.play()
            isPaused.current = false
            lastMoveAt.current = null
            roundStats.current.running = true
            roundStats.current.lastFrameTimestamp = null
            intervalRef.current = setInterval(() => {
                runGame()
            }, speed.current)
            startAnimation()
        } else {
            isPaused.current = true
            clearInterval(intervalRef.current)
            stopAnimation()
            roundStats.current.running = false
            roundStats.current.lastFrameTimestamp = null
            bgMusic.current.pause()
        }
    }

    function drawWelcomeScreen(){
        drawScreenBackground()

        roundedRectPath(context, 350, 118, 300, 54, 27)
        context.fillStyle = 'rgba(91, 208, 177, .16)'
        context.fill()
        context.strokeStyle = 'rgba(152, 234, 213, .5)'
        context.lineWidth = 2
        context.stroke()

        context.textAlign = 'center'
        context.textBaseline = 'middle'
        context.fillStyle = '#98ead5'
        context.font = '800 22px Montserrat, sans-serif'
        context.fillText('READY TO PLAY', 500, 145)

        const titleGradient = context.createLinearGradient(180, 0, 820, 0)
        titleGradient.addColorStop(0, '#ff91ad')
        titleGradient.addColorStop(.55, '#ff4fa5')
        titleGradient.addColorStop(1, '#ffc86b')
        context.font = '92px "Luckiest Guy", sans-serif'
        context.lineWidth = 9
        context.strokeStyle = 'rgba(15, 13, 36, .8)'
        context.strokeText('JANNIE SNAKE', 500, 250)
        context.fillStyle = titleGradient
        context.fillText('JANNIE SNAKE', 500, 250)

        context.fillStyle = 'rgba(255, 248, 236, .82)'
        context.font = '500 25px Montserrat, sans-serif'
        context.fillText('Collect drinks. Dodge the coffee.', 500, 316)

        drawSnakeDoodle(500, 500, false)
        drawDrinkIcon(770, 565)
        drawSparkle(265, 485, 22, '#ffc86b')
        drawSparkle(730, 420, 14, '#98ead5')

        context.fillStyle = 'rgba(255, 248, 236, .7)'
        context.font = '700 19px Montserrat, sans-serif'
        context.fillText('WASD  /  ARROW KEYS TO MOVE', 500, 748)

        roundedRectPath(context, 260, 810, 480, 68, 34)
        context.fillStyle = 'rgba(255, 79, 165, .16)'
        context.fill()
        context.strokeStyle = 'rgba(255, 145, 173, .55)'
        context.lineWidth = 2
        context.stroke()
        context.fillStyle = '#fff8ec'
        context.font = '800 21px Montserrat, sans-serif'
        context.fillText('PRESS PLAY TO BEGIN', 500, 844)
    }

    function drawScreenBackground() {
        const { width, height } = context.canvas
        context.clearRect(0, 0, width, height)

        const background = context.createLinearGradient(0, 0, width, height)
        background.addColorStop(0, '#17142d')
        background.addColorStop(.55, '#252044')
        background.addColorStop(1, '#302c56')
        context.fillStyle = background
        context.fillRect(0, 0, width, height)

        context.strokeStyle = 'rgba(170, 215, 81, .08)'
        context.lineWidth = 1
        for (let x = 40; x < width; x += 80) {
            context.beginPath()
            context.moveTo(x, 0)
            context.lineTo(x, height)
            context.stroke()
        }
        for (let y = 40; y < height; y += 80) {
            context.beginPath()
            context.moveTo(0, y)
            context.lineTo(width, y)
            context.stroke()
        }

        roundedRectPath(context, 62, 62, width - 124, height - 124, 44)
        context.fillStyle = 'rgba(23, 20, 45, .55)'
        context.fill()
        context.strokeStyle = 'rgba(255, 255, 255, .12)'
        context.lineWidth = 2
        context.stroke()
    }

    function drawSnakeDoodle(centerX, centerY, isGameOver) {
        const bodyGradient = context.createLinearGradient(centerX - 220, centerY, centerX + 200, centerY)
        bodyGradient.addColorStop(0, '#ff72bc')
        bodyGradient.addColorStop(.55, '#ff3b9f')
        bodyGradient.addColorStop(1, '#ff91ad')

        context.beginPath()
        context.moveTo(centerX - 220, centerY + 82)
        context.bezierCurveTo(centerX - 270, centerY - 100, centerX + 15, centerY - 150, centerX + 30, centerY - 18)
        context.bezierCurveTo(centerX + 45, centerY + 110, centerX + 210, centerY + 130, centerX + 185, centerY + 12)
        context.lineCap = 'round'
        context.lineJoin = 'round'
        context.lineWidth = 78
        context.strokeStyle = 'rgba(14, 12, 35, .48)'
        context.stroke()

        context.shadowColor = 'rgba(255, 59, 159, .28)'
        context.shadowBlur = 24
        context.lineWidth = 66
        context.strokeStyle = bodyGradient
        context.stroke()
        context.shadowBlur = 0

        context.beginPath()
        context.moveTo(centerX - 120, centerY - 77)
        context.bezierCurveTo(centerX - 42, centerY - 122, centerX + 34, centerY - 85, centerX + 42, centerY - 35)
        context.strokeStyle = 'rgba(255, 255, 255, .23)'
        context.lineWidth = 8
        context.stroke()

        const headX = centerX + 185
        const headY = centerY + 12
        context.beginPath()
        context.ellipse(headX, headY, 62, 54, -.12, 0, Math.PI * 2)
        context.fillStyle = '#ff4fa5'
        context.fill()
        context.strokeStyle = '#ffd2e8'
        context.lineWidth = 5
        context.stroke()

        if (isGameOver) {
            context.strokeStyle = '#fff8ec'
            context.lineWidth = 7
            context.lineCap = 'round'
            for (const eyeX of [headX + 5, headX + 35]) {
                context.beginPath()
                context.moveTo(eyeX - 7, headY - 12)
                context.lineTo(eyeX + 7, headY + 2)
                context.moveTo(eyeX + 7, headY - 12)
                context.lineTo(eyeX - 7, headY + 2)
                context.stroke()
            }
            context.beginPath()
            context.moveTo(headX + 12, headY + 25)
            context.quadraticCurveTo(headX + 25, headY + 12, headX + 38, headY + 25)
            context.stroke()
        } else {
            for (const eye of [{ x: headX + 8, y: headY - 12 }, { x: headX + 36, y: headY + 1 }]) {
                context.beginPath()
                context.arc(eye.x, eye.y, 11, 0, Math.PI * 2)
                context.fillStyle = '#fff8ec'
                context.fill()
                context.beginPath()
                context.arc(eye.x + 3, eye.y + 1, 4, 0, Math.PI * 2)
                context.fillStyle = '#302c56'
                context.fill()
            }
            context.beginPath()
            context.moveTo(headX + 49, headY + 19)
            context.lineTo(headX + 78, headY + 25)
            context.lineTo(headX + 91, headY + 18)
            context.moveTo(headX + 78, headY + 25)
            context.lineTo(headX + 91, headY + 33)
            context.strokeStyle = '#ff91ad'
            context.lineWidth = 6
            context.stroke()
        }
    }

    function drawDrinkIcon(x, y) {
        context.save()
        context.translate(x, y)

        roundedRectPath(context, -34, -18, 60, 58, 12)
        context.fillStyle = '#fff8ec'
        context.fill()
        context.strokeStyle = 'rgba(23, 20, 45, .6)'
        context.lineWidth = 4
        context.stroke()

        context.beginPath()
        context.ellipse(-4, -18, 30, 9, 0, 0, Math.PI * 2)
        context.fillStyle = '#ffcf67'
        context.fill()
        context.stroke()

        context.beginPath()
        context.moveTo(4, -25)
        context.lineTo(15, -54)
        context.strokeStyle = '#98ead5'
        context.lineWidth = 8
        context.lineCap = 'round'
        context.stroke()

        context.beginPath()
        context.arc(31, 8, 15, -Math.PI / 2, Math.PI / 2)
        context.strokeStyle = '#fff8ec'
        context.lineWidth = 7
        context.stroke()
        context.restore()
    }

    function drawSparkle(x, y, size, color) {
        context.save()
        context.translate(x, y)
        context.beginPath()
        context.moveTo(0, -size)
        context.lineTo(size * .24, -size * .24)
        context.lineTo(size, 0)
        context.lineTo(size * .24, size * .24)
        context.lineTo(0, size)
        context.lineTo(-size * .24, size * .24)
        context.lineTo(-size, 0)
        context.lineTo(-size * .24, -size * .24)
        context.closePath()
        context.fillStyle = color
        context.fill()
        context.restore()
    }

    function drawGameOverScreen() {
        drawScreenBackground()

        roundedRectPath(context, 350, 118, 300, 54, 27)
        context.fillStyle = 'rgba(255, 112, 143, .16)'
        context.fill()
        context.strokeStyle = 'rgba(255, 154, 176, .55)'
        context.lineWidth = 2
        context.stroke()

        context.textAlign = 'center'
        context.textBaseline = 'middle'
        context.fillStyle = '#ff9ab0'
        context.font = '800 21px Montserrat, sans-serif'
        context.fillText('ROUND COMPLETE', 500, 145)

        context.font = '104px "Luckiest Guy", sans-serif'
        context.lineWidth = 9
        context.strokeStyle = 'rgba(15, 13, 36, .8)'
        context.strokeText('GAME OVER', 500, 260)
        context.fillStyle = '#ff91ad'
        context.fillText('GAME OVER', 500, 260)

        context.fillStyle = 'rgba(255, 248, 236, .78)'
        context.font = '500 24px Montserrat, sans-serif'
        context.fillText('That was a close one!', 500, 322)

        drawSnakeDoodle(500, 430, true)

        roundedRectPath(context, 235, 700, 230, 104, 22)
        context.fillStyle = 'rgba(255, 255, 255, .07)'
        context.fill()
        roundedRectPath(context, 535, 700, 230, 104, 22)
        context.fill()

        context.fillStyle = 'rgba(255, 248, 236, .65)'
        context.font = '700 17px Montserrat, sans-serif'
        context.fillText('SCORE', 350, 727)
        context.fillText('TIME', 650, 727)
        context.fillStyle = '#fff8ec'
        context.font = '800 36px Montserrat, sans-serif'
        context.fillText(String(roundStats.current.score), 350, 770)
        context.fillText(formatElapsedTime(roundStats.current.elapsedMs), 650, 770)

        roundedRectPath(context, 250, 835, 500, 62, 31)
        context.fillStyle = 'rgba(255, 112, 143, .18)'
        context.fill()
        context.strokeStyle = 'rgba(255, 154, 176, .55)'
        context.lineWidth = 2
        context.stroke()
        context.fillStyle = '#fff8ec'
        context.font = '800 19px Montserrat, sans-serif'
        context.fillText('PRESS PLAY TO TRY AGAIN', 500, 866)
    }

    function gameOver() {
        roundStats.current.running = false
        roundStats.current.lastFrameTimestamp = null
        roundStats.current.speed = speed.current
        speed.current = 500
        audioSpeedMulti.current = 1

        bgMusic.current.pause()
        gameOverMusic.current.play()
        clearInterval(intervalRef.current)
        intervalRef.current = null
        stopAnimation()

        let step = 0
        const totalSteps = sizeCount.current

        const endInterval = setInterval(() => {
            if (step < totalSteps) {
                endDraw()
                step++
            } else {
                clearInterval(endInterval)
                sizeCount.current = 3
                history.current = []
                findEmptyCordinate()
                isPaused.current = false
                drawGameOverScreen()
            }
        }, 150)
    }

    function endDraw(){
        context.clearRect(0, 0, context.canvas.width, context.canvas.height)
        drawGrid()
        for (let i = 1; i <= sizeCount.current && i < history.current.length; i++) {
            const t = i / sizeCount.current

            const r = 255
            const g = Math.floor(20 + 180 * t)
            const b = Math.floor(150 + 105 * t)

            context.fillStyle = `rgb(${r}, ${g}, ${b})`
            context.beginPath()
            context.arc(
                history.current[i].x + TILE / 2,
                history.current[i].y + TILE / 2,
                TILE / 2,
                0,
                Math.PI * 2
            )
            context.fill()

            if (i < sizeCount.current && i + 1 < history.current.length) {
                const dx = Math.abs(history.current[i].x - history.current[i + 1].x)
                const dy = Math.abs(history.current[i].y - history.current[i + 1].y)

                if (dx <= TILE && dy <= TILE) {
                    const midX = (history.current[i].x + history.current[i + 1].x) / 2
                    const midY = (history.current[i].y + history.current[i + 1].y) / 2

                    context.fillStyle = `rgb(${r}, ${g}, ${b})`
                    context.fillRect(midX, midY, TILE, TILE)
                }
            }

        }

        context.drawImage(baseImg.current, pos.current.x - 50, pos.current.y - 50, TILE * 2, TILE * 2)
        context.drawImage(baseRewardImg.current, rewardPos.current.x, rewardPos.current.y, TILE, TILE)
        context.drawImage(trapImg.current, trapPos.current.x, trapPos.current.y, TILE, TILE)
        sizeCount.current--
    }

    function drawGrid(){
        const cols = context.canvas.width / TILE
        const rows = context.canvas.height / TILE

        for(let col = 0; col < cols; col++){
            for(let row = 0; row < rows; row++){
                if((col + row) % 2 === 0){
                    context.fillStyle = '#aad751'
                } else {
                    context.fillStyle = '#a2d149'
                }
                context.fillRect(col * TILE, row * TILE, TILE, TILE)
            }
        }
    }

    const draw = (context, progress = 1) => {
        context.clearRect(0, 0, context.canvas.width, context.canvas.height)

        drawGrid()

        const segments = []
        for (let i = 1; i <= sizeCount.current && i < history.current.length; i++) {
            const previousSegment = history.current[i + 1] || history.current[i]
            segments.push({
                x: interpolateWrapped(previousSegment.x, history.current[i].x, progress, context.canvas.width),
                y: interpolateWrapped(previousSegment.y, history.current[i].y, progress, context.canvas.height),
                index: i,
            })
        }

        for (let i = 0; i < segments.length - 1; i++) {
            const segment = segments[i]
            const nextSegment = segments[i + 1]
            const startX = segment.x + TILE / 2
            const startY = segment.y + TILE / 2
            const endX = interpolateWrapped(segment.x, nextSegment.x, 1, context.canvas.width) + TILE / 2
            const endY = interpolateWrapped(segment.y, nextSegment.y, 1, context.canvas.height) + TILE / 2
            const dx = Math.abs(startX - endX)
            const dy = Math.abs(startY - endY)

            if (dx <= TILE + 1 && dy <= TILE + 1) {
                const t = segment.index / sizeCount.current
                const nextT = nextSegment.index / sizeCount.current
                const xOffsets = getWrappedOffsets(Math.min(startX, endX), Math.max(startX, endX), context.canvas.width, TILE / 2)
                const yOffsets = getWrappedOffsets(Math.min(startY, endY), Math.max(startY, endY), context.canvas.height, TILE / 2)
                for (const offsetX of xOffsets) {
                    for (const offsetY of yOffsets) {
                        const gradient = context.createLinearGradient(
                            startX + offsetX,
                            startY + offsetY,
                            endX + offsetX,
                            endY + offsetY
                        )
                        gradient.addColorStop(0, `rgb(255, ${Math.floor(20 + 180 * t)}, ${Math.floor(150 + 105 * t)})`)
                        gradient.addColorStop(1, `rgb(255, ${Math.floor(20 + 180 * nextT)}, ${Math.floor(150 + 105 * nextT)})`)

                        context.lineCap = 'round'
                        const drawLink = (strokeStyle, lineWidth) => {
                            context.strokeStyle = strokeStyle
                            context.lineWidth = lineWidth
                            context.beginPath()
                            context.moveTo(startX + offsetX, startY + offsetY)
                            context.lineTo(endX + offsetX, endY + offsetY)
                            context.stroke()
                        }
                        drawLink('rgba(210, 20, 115, 0.35)', TILE * 0.96)
                        drawLink(gradient, TILE * 0.86)
                        drawLink('rgba(255, 255, 255, 0.2)', TILE * 0.12)
                    }
                }
            }
        }

        if (segments.length === 1) {
            const t = segments[0].index / sizeCount.current
            context.fillStyle = `rgb(255, ${Math.floor(20 + 180 * t)}, ${Math.floor(150 + 105 * t)})`
            context.beginPath()
            context.arc(segments[0].x + TILE / 2, segments[0].y + TILE / 2, TILE * 0.43, 0, Math.PI * 2)
            context.fill()
        }

        const head = history.current.length > 1
            ? {
                x: interpolateWrapped(history.current[1].x, history.current[0].x, progress, context.canvas.width),
                y: interpolateWrapped(history.current[1].y, history.current[0].y, progress, context.canvas.height),
            }
            : pos.current
        const headX = head.x + (TILE - HEAD_SIZE) / 2
        const headY = head.y + (TILE - HEAD_SIZE) / 2
        const headXOffsets = getWrappedOffsets(headX, headX + HEAD_SIZE, context.canvas.width, 0)
        const headYOffsets = getWrappedOffsets(headY, headY + HEAD_SIZE, context.canvas.height, 0)
        for (const offsetX of headXOffsets) {
            for (const offsetY of headYOffsets) {
                context.drawImage(baseImg.current, headX + offsetX, headY + offsetY, HEAD_SIZE, HEAD_SIZE)
            }
        }
        context.drawImage(baseRewardImg.current, rewardPos.current.x, rewardPos.current.y, TILE, TILE)
        context.drawImage(trapImg.current, trapPos.current.x, trapPos.current.y, TILE, TILE)
    }

    function changeDirection(nextDirection) {
        const oppositeDirection = {
            right: "left",
            left: "right",
            up: "down",
            down: "up",
        }
        if (intervalRef.current && oppositeDirection[currentHeading.current] === nextDirection) return

        const next = {
            right: nextDirection === "right",
            left: nextDirection === "left",
            up: nextDirection === "up",
            down: nextDirection === "down",
        }
        const changed = Object.keys(next).some(key => next[key] !== direction.current[key])
        if (!changed) return
        direction.current = next

        if (!intervalRef.current || isPaused.current) return

        clearInterval(intervalRef.current)
        runGame()

        if (intervalRef.current !== null) {
            clearInterval(intervalRef.current)
            intervalRef.current = setInterval(() => {
                runGame()
            }, speed.current)
        }
    }

    function keyPad(key) {
        const directionByKey = { W: "up", S: "down", D: "right", A: "left" }
        if (directionByKey[key]) changeDirection(directionByKey[key])
    }

    const setKey = (event) => {
        if (event.code === "KeyW" || event.code === "ArrowUp"){
            changeDirection("up")
        }
        else if (event.code === "KeyS" || event.code === "ArrowDown"){
            changeDirection("down")
        }
        else if (event.code === "KeyA" || event.code === "ArrowLeft"){
            changeDirection("left")
        }
        else if (event.code === "KeyD" || event.code === "ArrowRight"){
            changeDirection("right")
        }
    }

    function startGame(){
        if (intervalRef.current) return

        if (bgMusic.current && bgMusic.current.paused) {
            bgMusic.current.play()
        }

        drawGrid()
        findEmptyCordinate("reward")
        findEmptyCordinate("trap")

        isPaused.current = false
        lastMoveAt.current = null
        roundStats.current.score = 0
        roundStats.current.elapsedMs = 0
        roundStats.current.running = true
        roundStats.current.lastFrameTimestamp = null
        roundStats.current.speed = speed.current
        intervalRef.current = setInterval(() => {
            runGame()
        }, speed.current)
        startAnimation()

        return () => clearInterval(intervalRef.current)
    }

    function runGame() {
        bgMusic.current.playbackRate = audioSpeedMulti.current

        if (direction.current.up) {
            currentHeading.current = "up"
            pos.current.y -= TILE
        } else if (direction.current.down) {
            currentHeading.current = "down"
            pos.current.y += TILE
        } else if (direction.current.left) {
            currentHeading.current = "left"
            pos.current.x -= TILE
        } else if (direction.current.right) {
            currentHeading.current = "right"
            pos.current.x += TILE
        }

        if (pos.current.y < 0) pos.current.y = context.canvas.height - TILE
        else if (pos.current.y >= context.canvas.height) pos.current.y = 0
        else if (pos.current.x < 0) pos.current.x = context.canvas.width - TILE
        else if (pos.current.x >= context.canvas.width) pos.current.x = 0

        history.current.unshift({ ...pos.current })

        history.current = history.current.slice(0, sizeCount.current + 2)

        collisionCheck()

        if (pos.current.x === rewardPos.current.x && pos.current.y === rewardPos.current.y) {
            sizeCount.current++
            roundStats.current.score++
            rewardMusic.current.play()
            findEmptyCordinate("reward")

            audioSpeedMulti.current += 0.02
            console.log(audioSpeedMulti.current)

            speed.current = Math.max(50, speed.current - 10)
            roundStats.current.speed = speed.current
            clearInterval(intervalRef.current)
            intervalRef.current = setInterval(() => {
                runGame()
            }, speed.current)
        }

        if (pos.current.x === trapPos.current.x && pos.current.y === trapPos.current.y) {
            sizeCount.current = sizeCount.current / 2
            roundStats.current.score = Math.max(0, roundStats.current.score - 1)
            trapMusic.current.play()
            findEmptyCordinate("trap")
        }

        lastMoveAt.current = frameTime.current
    }

    function findEmptyCordinate(selection){
        let randomX
        let randomY

        let freeSpaceFound = false
        while(freeSpaceFound == false){
            randomX = Math.floor(Math.random() * (context.canvas.width / TILE)) * TILE
            randomY = Math.floor(Math.random() * (context.canvas.height / TILE)) * TILE

            freeSpaceFound = true
            for(let i = 0; i < sizeCount.current && i < history.current.length; i++){
                if(history.current[i].x == randomX && history.current[i].y == randomY){
                    freeSpaceFound = false
                    break
                }
            }

            const totalTiles = (context.canvas.width / TILE) * (context.canvas.height / TILE)
            if (sizeCount.current >= totalTiles - 5) {
                console.log("You won")
                return
            }

            if(randomX == rewardPos.current.x && randomY == rewardPos.current.y)
                freeSpaceFound = false
            else if(randomX == trapPos.current.x && randomY == trapPos.current.y)
                freeSpaceFound = false
        }
        if(selection === "reward")
            rewardPos.current = { x: randomX, y: randomY }
        else if(selection === "trap")
            trapPos.current = { x: randomX, y: randomY }
    }

    function collisionCheck(){
        for(let i = 1; i <= sizeCount.current && i < history.current.length; i++){
            if(pos.current.x == history.current[i].x && pos.current.y == history.current[i].y){
                gameOver()
                break
            }
        }
    }

    return (
    <>
        <div className="map-wrapper">
            <div className="game-frame">
                <GameHud statsRef={roundStats} />
                <canvas
                    onKeyDown={setKey}
                    className='map'
                    tabIndex={0}
                    ref={ref}
                    width="1000"
                    height="1000"
                    aria-label="Jannie Snake game board"
                    {...props}
                />
            </div>
        </div>
        <div className="controller">
            <div className="controller-inner">
                <div className="dpad">
                    <button className="empty" aria-hidden="true" />
                    <button type="button" onClick={() => keyPad("W")} aria-label="Move up">
                        <svg viewBox="0 0 24 24" aria-hidden="true">
                            <path d="M12 19V5m-6 6 6-6 6 6" />
                        </svg>
                    </button>
                    <button className="empty" aria-hidden="true" />
                    <button type="button" onClick={() => keyPad("A")} aria-label="Move left">
                        <svg viewBox="0 0 24 24" aria-hidden="true">
                            <path d="M19 12H5m6-6-6 6 6 6" />
                        </svg>
                    </button>
                    <button className="empty" aria-hidden="true" />
                    <button type="button" onClick={() => keyPad("D")} aria-label="Move right">
                        <svg viewBox="0 0 24 24" aria-hidden="true">
                            <path d="M5 12h14m-6-6 6 6-6 6" />
                        </svg>
                    </button>
                    <button className="empty" aria-hidden="true" />
                    <button type="button" onClick={() => keyPad("S")} aria-label="Move down">
                        <svg viewBox="0 0 24 24" aria-hidden="true">
                            <path d="M12 5v14m6-6-6 6-6-6" />
                        </svg>
                    </button>
                    <button className="empty" aria-hidden="true" />
                </div>
                <div className="game-actions">
                    <button className="start-btn" type="button" onClick={startGame} aria-label="Start game">
                        <span className="start-btn__icon" aria-hidden="true">
                            <svg viewBox="0 0 24 24">
                                <path d="M8 5.5v13L19 12 8 5.5Z" />
                            </svg>
                        </span>
                        <span>Play</span>
                    </button>
                    <button className="pause-btn" type="button" onClick={togglePause} aria-label="Pause game">
                        <svg viewBox="0 0 24 24" aria-hidden="true">
                            <path d="M7 5h4v14H7zM15 5h4v14h-4z" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    </>
    )
}

export default Canvas