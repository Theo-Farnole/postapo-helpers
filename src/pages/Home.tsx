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
          Resources excess calculator
        </a>
      </section>
    </main>
  )
}

export default Home
