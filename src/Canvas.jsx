import { useEffect, useRef } from 'react'

const TILE = 100
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

// lägg till hicgscore och koppla till api

const Canvas = props => {
    const ref = useRef()
    const pos = useRef({ x: 0, y: 0 })
    const history = useRef([])
    const sizeCount = useRef(3)
    const rewardPos = useRef({ x: 0, y: 0 })
    const trapPos = useRef({ x: 0, y: 0 })
    const direction = useRef({right: true, left: false, up: false, down: false})
    const speed = useRef(500)

    const baseImg = useRef(null)
    const baseRewardImg = useRef(null)
    const gameOverImg = useRef(null)
    const logoImg = useRef(null)
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

        gameOverImg.current = new Image()
        gameOverImg.current.src = `${base}img/gameover.png`;

        logoImg.current = new Image()
        logoImg.current.src = `${base}img/logo.png`;

        const canvas = ref.current
        context = canvas.getContext("2d")
        
        logoImg.current.onload = () => {
            drawWelcomeScreen()
        }

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
        if (isPaused.current) {
            bgMusic.current.play()
            isPaused.current = false
            lastMoveAt.current = null
            intervalRef.current = setInterval(() => {
                runGame()
            }, speed.current)
            startAnimation()
        } else {
            isPaused.current = true
            clearInterval(intervalRef.current)
            stopAnimation()
            bgMusic.current.pause()
        }
    }

    function drawWelcomeScreen(){
        context.fillStyle = 'black'
        context.fillRect(0, 0, context.canvas.width, context.canvas.height)
        
        const img = logoImg.current
        const scale = Math.min(
            context.canvas.width / img.naturalWidth,
            context.canvas.height / img.naturalHeight
        )
        const w = img.naturalWidth * scale
        const h = img.naturalHeight * scale
        const x = (context.canvas.width - w) / 2
        const y = (context.canvas.height - h) / 2

        context.drawImage(logoImg.current, x, y, w, h)
    }

    function gameOver() {
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

                context.clearRect(0, 0, context.canvas.width, context.canvas.height)
                
                const img = gameOverImg.current
                const scale = Math.min(
                    context.canvas.width / img.naturalWidth,
                    context.canvas.height / img.naturalHeight
                )
                const w = img.naturalWidth * scale
                const h = img.naturalHeight * scale
                const x = (context.canvas.width - w) / 2
                const y = (context.canvas.height - h) / 2

                context.fillStyle = 'black'
                context.fillRect(0, 0, context.canvas.width, context.canvas.height)

                context.drawImage(gameOverImg.current, x, y, w, h)
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

        for (const segment of segments) {
            const t = segment.index / sizeCount.current
            context.fillStyle = `rgb(255, ${Math.floor(20 + 180 * t)}, ${Math.floor(150 + 105 * t)})`
            const centerX = segment.x + TILE / 2
            const centerY = segment.y + TILE / 2
            const xOffsets = getWrappedOffsets(centerX, centerX, context.canvas.width, TILE / 2)
            const yOffsets = getWrappedOffsets(centerY, centerY, context.canvas.height, TILE / 2)
            for (const offsetX of xOffsets) {
                for (const offsetY of yOffsets) {
                    context.beginPath()
                    context.arc(centerX + offsetX, centerY + offsetY, TILE / 2, 0, Math.PI * 2)
                    context.fill()
                }
            }
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

                        context.strokeStyle = gradient
                        context.lineWidth = TILE
                        context.lineCap = 'round'
                        context.beginPath()
                        context.moveTo(startX + offsetX, startY + offsetY)
                        context.lineTo(endX + offsetX, endY + offsetY)
                        context.stroke()
                    }
                }
            }
        }

        const head = history.current.length > 1
            ? {
                x: interpolateWrapped(history.current[1].x, history.current[0].x, progress, context.canvas.width),
                y: interpolateWrapped(history.current[1].y, history.current[0].y, progress, context.canvas.height),
            }
            : pos.current
        const headX = head.x - TILE / 2
        const headY = head.y - TILE / 2
        const headXOffsets = getWrappedOffsets(headX, headX + TILE * 2, context.canvas.width, 0)
        const headYOffsets = getWrappedOffsets(headY, headY + TILE * 2, context.canvas.height, 0)
        for (const offsetX of headXOffsets) {
            for (const offsetY of headYOffsets) {
                context.drawImage(baseImg.current, headX + offsetX, headY + offsetY, TILE * 2, TILE * 2)
            }
        }
        context.drawImage(baseRewardImg.current, rewardPos.current.x, rewardPos.current.y, TILE, TILE)
        context.drawImage(trapImg.current, trapPos.current.x, trapPos.current.y, TILE, TILE)
    }

    function keyPad(key){
        if (key === "W"){
            direction.current = {right: false, left: false, up: true, down: false}
        }
        else if (key === "S"){
            direction.current = {right: false, left: false, up: false, down: true}
        }
        else if (key === "D"){
            direction.current = {right: true, left: false, up: false, down: false}
        }
        else if (key === "A"){
            direction.current = {right: false, left: true, up: false, down: false}
        }
    }

    const setKey = (event) => {
        if (event.code === "KeyW" || event.code === "ArrowUp"){
            direction.current = {right: false, left: false, up: true, down: false}
        }
        else if (event.code === "KeyS" || event.code === "ArrowDown"){
            direction.current = {right: false, left: false, up: false, down: true}
        }
        else if (event.code === "KeyA" || event.code === "ArrowLeft"){
            direction.current = {right: false, left: true, up: false, down: false}
        }
        else if (event.code === "KeyD" || event.code === "ArrowRight"){
            direction.current = {right: true, left: false, up: false, down: false}
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
        intervalRef.current = setInterval(() => {
            runGame()
        }, speed.current)
        startAnimation()

        return () => clearInterval(intervalRef.current)
    }

    function runGame() {
        bgMusic.current.playbackRate = audioSpeedMulti.current

        if (direction.current.up) pos.current.y -= TILE
        else if (direction.current.down) pos.current.y += TILE
        else if (direction.current.left) pos.current.x -= TILE
        else if (direction.current.right) pos.current.x += TILE

        if (pos.current.y < 0) pos.current.y = context.canvas.height - TILE
        else if (pos.current.y >= context.canvas.height) pos.current.y = 0
        else if (pos.current.x < 0) pos.current.x = context.canvas.width - TILE
        else if (pos.current.x >= context.canvas.width) pos.current.x = 0

        history.current.unshift({ ...pos.current })

        history.current = history.current.slice(0, sizeCount.current + 2)

        collisionCheck()

        if (pos.current.x === rewardPos.current.x && pos.current.y === rewardPos.current.y) {
            sizeCount.current++
            rewardMusic.current.play()
            findEmptyCordinate("reward")

            audioSpeedMulti.current += 0.02
            console.log(audioSpeedMulti.current)

            speed.current = Math.max(50, speed.current - 10)
            clearInterval(intervalRef.current)
            intervalRef.current = setInterval(() => {
                runGame()
            }, speed.current)
        }

        if (pos.current.x === trapPos.current.x && pos.current.y === trapPos.current.y) {
            sizeCount.current = sizeCount.current / 2
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
                    <button onClick={() => keyPad("W")} aria-label="Move up">↑</button>
                    <button className="empty" aria-hidden="true" />
                    <button onClick={() => keyPad("A")} aria-label="Move left">←</button>
                    <button className="empty" aria-hidden="true" />
                    <button onClick={() => keyPad("D")} aria-label="Move right">→</button>
                    <button className="empty" aria-hidden="true" />
                    <button onClick={() => keyPad("S")} aria-label="Move down">↓</button>
                    <button className="empty" aria-hidden="true" />
                </div>
                <div className="game-actions">
                    <button className="start-btn" onClick={startGame} aria-label="Start game">
                        <span>Play</span>
                    </button>
                    <button className="pause-btn" onClick={togglePause} aria-label="Pause game">
                        <span aria-hidden="true">Ⅱ</span>
                        <small>Pause</small>
                    </button>
                </div>
            </div>
        </div>
    </>
    )
}

export default Canvas