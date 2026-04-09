import { Nav } from '@/components/Nav';
import { Hero } from '@/components/Hero';
import { ScarcityBar } from '@/components/ScarcityBar';
import { ValueProps } from '@/components/ValueProps';
import { Calculator } from '@/components/Calculator';
import { Comparison } from '@/components/Comparison';
import { HowItWorks } from '@/components/HowItWorks';
import { Testimonials } from '@/components/Testimonials';
import { FAQ } from '@/components/FAQ';
import { SignupForm } from '@/components/SignupForm';
import { Footer } from '@/components/Footer';
import { getWaitlistCount } from '@/lib/supabase';

// Revalidate every 60 seconds to keep the counter fresh
export const revalidate = 60;

export default async function HomePage() {
  const signedUp = await getWaitlistCount();

  return (
    <main>
      <Nav />
      <Hero />
      <ScarcityBar signedUp={signedUp} total={50} />
      <ValueProps />
      <Calculator />
      <Comparison />
      <HowItWorks />
      <Testimonials />
      <FAQ />
      <SignupForm />
      <Footer />
    </main>
  );
}
