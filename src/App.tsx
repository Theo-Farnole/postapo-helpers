import { useEffect, useState } from 'react'
import logo from './assets/logo.png'
import chipsIcon from './assets/resources/chips.webp'
import foodIcon from './assets/resources/food.webp'
import Home from './pages/Home'
import ResourcesExcessCalculator from './pages/ResourcesExcessCalculator'
import FoodAdsExcess from './pages/FoodAdsExcess'
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

const PAGES: Record<
  string,
  { title: string; subtitle?: string; icon?: string }
> = {
  '/ResourcesExcessCalculator': {
    title: 'Resources excess calculator',
    subtitle: 'after 50% ads bonus',
    icon: chipsIcon,
  },
  '/TycoonBonusCalculator': {
    title: 'Food Excess',
    subtitle: 'after 5 min with 3x bonus',
    icon: foodIcon,
  },
}

function App() {
  const route = useHashRoute()
  const page = PAGES[route] ?? { title: 'Post Apo Tycoon helpers' }

  useEffect(() => {
    document.title = PAGES[route]
      ? `${page.title} · Post Apo Tycoon helpers`
      : 'Post Apo Tycoon helpers'
  }, [page.title, route])

  return (
    <>
      <header className="site-header">
        <a
          className="site-brand"
          href="#/"
          aria-label="Post Apo Tycoon helpers home"
        >
          <img
            className="site-logo"
            src={logo}
            alt=""
            height={96}
          />
        </a>
        <div className="site-heading">
          <h1>
            {page.icon ? (
              <img className="site-heading-icon" src={page.icon} alt="" />
            ) : null}
            {page.title}
          </h1>
          {page.subtitle ? <p>{page.subtitle}</p> : null}
        </div>
      </header>
      {route === '/ResourcesExcessCalculator' ? (
        <ResourcesExcessCalculator />
      ) : route === '/TycoonBonusCalculator' ? (
        <FoodAdsExcess />
      ) : (
        <Home />
      )}
    </>
  )
}

export default App
