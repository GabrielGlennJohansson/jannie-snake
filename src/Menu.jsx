function Menu() {
  return (
    <div className="menu">
      <img src={`${import.meta.env.BASE_URL}img/banner.png`} alt="Banner" />
      <ul>
        <li><a href="#">Highscore</a></li>
      </ul>
    </div>
  )
}

export default Menu