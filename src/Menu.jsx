function Menu() {
  return (
    <header className="menu">
      <div className="brand-mark">
        <img src={`${import.meta.env.BASE_URL}img/logo.png`} alt="" />
      </div>
      <div className="menu-title">
        <span>JANNIE</span>
        <strong>SNAKE</strong>
      </div>
      <a className="highscore-link" href="#highscore" aria-label="View highscore">
        <span className="trophy" aria-hidden="true">◆</span>
        <span>Best</span>
      </a>
    </header>
  )
}

export default Menu