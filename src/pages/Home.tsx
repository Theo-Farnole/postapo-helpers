import chipsIcon from '../assets/resources/chips.webp'
import foodIcon from '../assets/resources/food.webp'
import './Home.css'

function Home() {
  return (
    <main className="home">
      <header>
        <h1>Postapo helpers</h1>
        <p>Tools for post-apocalyptic resource planning.</p>
      </header>

      <section className="home-tools" aria-label="Tools">
        <a className="home-tool" href="#/ResourcesExcessCalculator">
          <span className="home-tool-title">
            <img className="home-tool-icon" src={chipsIcon} alt="" />
            Resources excess calculator
          </span>
          <span className="home-tool-subtitle">after 50% ads bonus</span>
        </a>
        <a className="home-tool" href="#/TycoonBonusCalculator">
          <span className="home-tool-title">
            <img className="home-tool-icon" src={foodIcon} alt="" />
            Food Excess
          </span>
          <span className="home-tool-subtitle">after 5 min with 3x bonus</span>
        </a>
      </section>
    </main>
  )
}

export default Home
