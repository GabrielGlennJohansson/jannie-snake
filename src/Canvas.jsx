import { useEffect, useRef } from 'react'

const TILE = 100  // 👈 Ändra storlek här

const Canvas = props => {
    const ref = useRef()
    const pos = useRef({ x: 0, y: 0 })
    const history = useRef([])
    const sizeCount = useRef(3)
    const rewardPos = useRef({ x: 0, y: 0 })
    const direction = useRef({right: true, left: false, up: false, down: false})

    const baseImg = useRef(null)
    const baseRewardImg = useRef(null)

    let context = useRef(null)

    useEffect(() => {
        const base = import.meta.env.BASE_URL;

        baseImg.current = new Image()
        baseImg.current.src = `${base}img/jannie2.png`;

        baseRewardImg.current = new Image()
        baseRewardImg.current.src = `${base}img/powder.png`;

        const canvas = ref.current
        context = canvas.getContext("2d")
        drawGrid()

        const gameInterval = setInterval(() => {
            runGame()
        }, 500);
        return () => clearInterval(gameInterval)
    }, [])

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
        if (event.code === "KeyW"){
            direction.current = {right: false, left: false, up: true, down: false}
        }
        else if (event.code === "KeyS"){
            direction.current = {right: false, left: false, up: false, down: true}
        }
        else if (event.code === "KeyA"){
            direction.current = {right: false, left: true, up: false, down: false}
        }
        else if (event.code === "KeyD"){
            direction.current = {right: true, left: false, up: false, down: false}
        }
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
                sizeCount.current = 0
                history.current = []
                break
            }
        }
    }

    return (
    <>
        <canvas
            onKeyDown={setKey}
            className='map'
            tabIndex={0}
            ref={ref}
            width="1000" 
            height="1000"
            {...props}
        />
        <div className="controller">
            <div className="directions">
                <div className="left-controller">
                    <button onClick={() => keyPad("D")}>⇐</button>
                    <button onClick={() => keyPad("A")}>⇒</button>
                </div>
                <div className="right-controller">
                    <button onClick={() => keyPad("W")}>⇑</button>
                    <button onClick={() => keyPad("S")}>⇓</button>
                </div>
            </div>
        </div>
    </>
    )
}

export default Canvas