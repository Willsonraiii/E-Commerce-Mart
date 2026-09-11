import { useEffect } from 'react'

function setMeta(attr, key, content) {
  if (!content) return
  let el = document.head.querySelector(`meta[${attr}="${key}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

export default function Seo({ title, description, path = '/', image = '/images/hero-produce.jpg', jsonLd }) {
  useEffect(() => {
    if (title) document.title = title
    setMeta('name', 'description', description)
    setMeta('property', 'og:title', title)
    setMeta('property', 'og:description', description)
    setMeta('property', 'og:type', 'website')
    setMeta('property', 'og:image', image)
    setMeta('name', 'twitter:card', 'summary_large_image')
    setMeta('name', 'twitter:title', title)
    setMeta('name', 'twitter:description', description)

    let link = document.head.querySelector('link[rel="canonical"]')
    if (!link) {
      link = document.createElement('link')
      link.rel = 'canonical'
      document.head.appendChild(link)
    }
    link.href = `${window.location.origin}${path}`
  }, [title, description, path, image])

  useEffect(() => {
    if (!jsonLd) return undefined
    const s = document.createElement('script')
    s.type = 'application/ld+json'
    s.text = JSON.stringify(jsonLd)
    document.head.appendChild(s)
    return () => { document.head.removeChild(s) }
  }, [jsonLd])

  return null
}
