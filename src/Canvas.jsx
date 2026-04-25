import { use, useEffect, useRef } from 'react'

const TILE = 100

const Canvas = props => {
    const ref = useRef()
    const pos = useRef({ x: 0, y: 0 })
    const history = useRef([])
    const sizeCount = useRef(3)
    const rewardPos = useRef({ x: 0, y: 0 })
    const direction = useRef({right: true, left: false, up: false, down: false})

    const baseImg = useRef(null)
    const baseRewardImg = useRef(null)
    const gameOverImg = useRef(null)
    const logoImg = useRef(null)

    const bgMusic = useRef(null)
    const gameOverMusic = useRef(null)
    const rewardMusic = useRef(null)

    let context = useRef(null)

    const isPaused = useRef(false)
    const intervalRef = useRef(null)

    useEffect(() => {
        const base = import.meta.env.BASE_URL;

        bgMusic.current = new Audio(`${import.meta.env.BASE_URL}sound/theme.mp3`)
        bgMusic.current.loop = true
        bgMusic.current.volume = 0.2

        gameOverMusic.current = new Audio(`${import.meta.env.BASE_URL}sound/game-over.mp3`)
        gameOverMusic.current.volume = 0.4

        rewardMusic.current = new Audio(`${import.meta.env.BASE_URL}sound/reward.mp3`)
        rewardMusic.current.volume = 0.4

        baseImg.current = new Image()
        baseImg.current.src = `${base}img/jannie2.png`;

        baseRewardImg.current = new Image()
        baseRewardImg.current.src = `${base}img/drink.png`;

        gameOverImg.current = new Image()
        gameOverImg.current.src = `${base}img/gameover.png`;

        logoImg.current = new Image()
        logoImg.current.src = `${base}img/logo.png`;

        const canvas = ref.current
        context = canvas.getContext("2d")
        
        logoImg.current.onload = () => {
            drawWelcomeScreen()
        }
    }, [])

    function togglePause() {
        if (isPaused.current) {
            bgMusic.current.play()
            isPaused.current = false
            intervalRef.current = setInterval(() => {
                runGame()
            }, 500)
        } else {
            isPaused.current = true
            clearInterval(intervalRef.current)
            bgMusic.current.pause()
        }
    }

    function drawWelcomeScreen(){        
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
        bgMusic.current.pause()
        gameOverMusic.current.play()
        clearInterval(intervalRef.current)
        intervalRef.current = null

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

            if (i + 1 < history.current.length) {
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

    const draw = (context) => {
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

            if (i + 1 < history.current.length) {
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
    }

    function keyPad(key){
        if (key === "W"){
            direction.current = {right: false, left: false, up: true, down: false}
        }
        else if (key === "S"){
            direction.current = {right: false, left: false, up: false, down: true}
        }
        else if (key === "D"){
            direction.current = {right: false, left: true, up: false, down: false}
        }
        else if (key === "A"){
            direction.current = {right: true, left: false, up: false, down: false}
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
        findEmptyCordinate()

        intervalRef.current = setInterval(() => {
            runGame()
        }, 500)

        return () => clearInterval(intervalRef.current)
    }

    function runGame() {
        if (direction.current.up) pos.current.y -= TILE
        else if (direction.current.down) pos.current.y += TILE
        else if (direction.current.left) pos.current.x -= TILE
        else if (direction.current.right) pos.current.x += TILE

        if (pos.current.y < 0) pos.current.y = context.canvas.height - TILE
        else if (pos.current.y >= context.canvas.height) pos.current.y = 0
        else if (pos.current.x < 0) pos.current.x = context.canvas.width - TILE
        else if (pos.current.x >= context.canvas.width) pos.current.x = 0

        history.current.unshift({ ...pos.current })

        history.current = history.current.slice(0, sizeCount.current + 1)

        collisionCheck()

        if (pos.current.x === rewardPos.current.x && pos.current.y === rewardPos.current.y) {
            sizeCount.current++
            rewardMusic.current.play()
            findEmptyCordinate()
        }

        draw(context)
    }

    function findEmptyCordinate(){
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
        }
        rewardPos.current = { x: randomX, y: randomY }
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
        <canvas
            onKeyDown={setKey}
            className='map'
            tabIndex={0}
            ref={ref}
            width="1000"
            height="1000"
            {...props}
        />
        </div>
        <div className="controller">
            <div className="controller-inner">
                <div className="dpad">
                    <button className="empty" aria-hidden="true" />
                    <button onClick={() => keyPad("W")}>⇑</button>
                    <button className="empty" aria-hidden="true" />
                    <button onClick={() => keyPad("D")}>⇐</button>
                    <button className="empty" aria-hidden="true" />
                    <button onClick={() => keyPad("A")}>⇒</button>
                    <button className="empty" aria-hidden="true" />
                    <button onClick={() => keyPad("S")}>⇓</button>
                    <button className="empty" aria-hidden="true" />
                </div>
                <button className="start-btn" onClick={startGame}>
                    Start
                </button>
                <button className="pause-btn" onClick={togglePause}>
                    ⏸
                </button>
            </div>
        </div>
    </>
    )
}

export default Canvas