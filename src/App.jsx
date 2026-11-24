import Canvas from "./Canvas"
import Menu from "./Menu"
import "../stylesheet/map.css"
import "../stylesheet/main.css"
import "../stylesheet/menu.css"
import "../stylesheet/controller.css"
import "../stylesheet/responsive.css"

import { useEffect, useState } from "react"
import { supabase } from "./supabaseClient"

function App() {
  const [notes, setNotes] = useState([])

  useEffect(() => {
    const fetchNotes = async () => {
      let {data, error} = await supabase.from("posts").select("*")

      if(error){
        console.log("Error fetching post: ", error)
      } else {
        setNotes(data)
      }
      console.log(notes)
    }

    fetchNotes()
  }, [])

  async function saveNote() {
    await supabase.from("posts").insert([
      {
        name: "Test3",
        score: 100
      }
    ])
  }

  return (
    <div className="wrapper">
      <div className="main">
        <Menu />
        <Canvas />
        <button onClick={saveNote}>TESTA</button>
      </div>
    </div>
  )
}

export default App
