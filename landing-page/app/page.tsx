import Hero from '@/components/Hero'
import PainPoints from '@/components/PainPoints'
import Solutions from '@/components/Solutions'
import Features from '@/components/Features'
import TargetUsers from '@/components/TargetUsers'
import Workflow from '@/components/Workflow'
import TechStack from '@/components/TechStack'
import CTA from '@/components/CTA'
import Footer from '@/components/Footer'

export default function Home() {
  return (
    <main>
      <Hero />
      <PainPoints />
      <Solutions />
      <Features />
      <TargetUsers />
      <Workflow />
      <TechStack />
      <CTA />
      <Footer />
    </main>
  )
}
