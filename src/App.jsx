import Canvas from "./Canvas"
import Menu from "./Menu"
import "../stylesheet/map.css"
import "../stylesheet/main.css"
import "../stylesheet/menu.css"
import "../stylesheet/controller.css"
import "../stylesheet/responsive.css"

function App() {
  return (
    <div className="wrapper">
      <div className="main">
        <Menu />
        <Canvas />
      </div>
    </div>
  )
}

export default App
