import Hero from '../components/Hero'
import CategorySection from '../components/CategorySection'
import FeaturedSection from '../components/FeaturedSection'
import OffersSection from '../components/OffersSection'
import VegetableSection from '../components/VegetableSection'
import Testimonials from '../components/Testimonials'
import Seo from '../components/Seo'

const LD = {
  '@context': 'https://schema.org',
  '@type': 'GroceryStore',
  name: 'Yalambar Store',
  description: 'Neighborhood store in New Baneshwor, Kathmandu.',
  address: {
    '@type': 'PostalAddress',
    streetAddress: 'Shop 12, New Baneshwor Chowk',
    addressLocality: 'Kathmandu',
    postalCode: '44600',
    addressCountry: 'NP',
  },
  openingHours: 'Su-Fr 07:00-21:00, Sa 08:00-20:00',
  telephone: '+977 1-5901840',
  logo: '/brand/logo-full.png',
  image: '/brand/logo-full.png',
}

export default function HomePage() {
  return (
    <>
      <Seo
        title="Yalambar Store — Your Everyday Store."
        description="Fresh groceries, household essentials and daily necessities in New Baneshwor, Kathmandu. Delivered in as little as one hour."
        path="/"
        jsonLd={LD}
      />
      <Hero />
      <CategorySection />
      <FeaturedSection />
      <OffersSection />
      <VegetableSection />
      <Testimonials />
    </>
  )
}
