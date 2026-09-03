import { useEffect, useState } from 'react'
import logo from './assets/logo.png'
import Home from './pages/Home'
import ResourcesExcessCalculator from './pages/ResourcesExcessCalculator'
import './App.css'

function useHashRoute() {
  const [hash, setHash] = useState(() => window.location.hash)

  useEffect(() => {
    const onHashChange = () => setHash(window.location.hash)
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  const path = hash.replace(/^#/, '') || '/'
  return path.startsWith('/') ? path : `/${path}`
}

function App() {
  const route = useHashRoute()

  return (
    <>
      <header className="site-header">
        <a className="site-brand" href="#/" aria-label="Postapo helpers home">
          <img
            className="site-logo"
            src={logo}
            alt=""
            height={96}
          />
        </a>
      </header>
      {route === '/ResourcesExcessCalculator' ? (
        <ResourcesExcessCalculator />
      ) : (
        <Home />
      )}
    </>
  )
}

export default App
