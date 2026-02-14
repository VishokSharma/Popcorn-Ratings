import Link from 'next/link'
import styles from './page.module.css'

export default function Home() {
  return (
    <main className={styles.main}>
      {/* Animated Background Blobs */}
      <div className={styles.blob1}></div>
      <div className={styles.blob2}></div>
      <div className={styles.blob3}></div>

      {/* Vintage Film Grain */}
      <div className={styles.filmGrain}></div>

      {/* Floating Popcorn Animation */}
      <div className={styles.floatingPopcorn}>
        <span className={styles.popcorn1}>🍿</span>
        <span className={styles.popcorn2}>🍿</span>
        <span className={styles.popcorn3}>🍿</span>
        <span className={styles.popcorn4}>🍿</span>
        <span className={styles.popcorn5}>🍿</span>
        <span className={styles.popcorn6}>🍿</span>
      </div>

      {/* Floating Tickets */}
      <div className={styles.floatingTickets}>
        <div className={styles.ticket1}>🎫</div>
        <div className={styles.ticket2}>🎫</div>
        <div className={styles.ticket3}>🎫</div>
      </div>

      {/* Theater Marquee Header */}
      <header className={styles.theaterMarquee}>
        <div className={styles.marqueeLights}>
          <div className={styles.bulb}></div>
          <div className={styles.bulb}></div>
          <div className={styles.bulb}></div>
          <div className={styles.bulb}></div>
          <div className={styles.bulb}></div>
          <div className={styles.bulb}></div>
          <div className={styles.bulb}></div>
          <div className={styles.bulb}></div>
        </div>
        
        <nav className={styles.nav}>
          <div className={styles.logo}>
            <span className={styles.logoIcon}>🍿</span>
            <span className={styles.logoText}>Popcorn Ratings</span>
          </div>
          <div className={styles.navLinks}>
            <Link href="/dashboard" className={styles.navLink}>Dashboard</Link>
            <Link href="/auth" className={styles.navBtn}>Sign In</Link>
          </div>
        </nav>

        <div className={styles.marqueeLights}>
          <div className={styles.bulb}></div>
          <div className={styles.bulb}></div>
          <div className={styles.bulb}></div>
          <div className={styles.bulb}></div>
          <div className={styles.bulb}></div>
          <div className={styles.bulb}></div>
          <div className={styles.bulb}></div>
          <div className={styles.bulb}></div>
        </div>
      </header>

      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          
          {/* Download Extension Card - Above Main Ticket */}
          <div className={styles.downloadCard}>
            <div className={styles.downloadIcon}>⬇️</div>
            <div className={styles.downloadContent}>
              <h3 className={styles.downloadTitle}>GET THE EXTENSION</h3>
              <p className={styles.downloadDesc}>Start rating your shows in 2 seconds</p>
            </div>
            <a 
              href="https://chrome.google.com/webstore" 
              target="_blank"
              rel="noopener noreferrer"
              className={styles.downloadBtn}
            >
              DOWNLOAD FREE
            </a>
          </div>

          {/* Main Ticket - Smaller Size */}
          <div className={styles.mainTicket}>
            <div className={styles.ticketStamp}>
              <span>★</span>
            </div>

            <div className={styles.admitOne}>ADMIT ONE</div>

            <div className={styles.popcornHero}>🍿</div>

            <h1 className={styles.heroTitle}>
              POPCORN<br/>
              <span className={styles.highlight}>RATINGS</span>
            </h1>

            <p className={styles.heroSubtitle}>
              Rate Shows While The Popcorn's Fresh
            </p>

            <div className={styles.perforation}></div>

            <div className={styles.ticketInfo}>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>GENRE:</span>
                <span className={styles.infoValue}>Show Tracking</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>RUNTIME:</span>
                <span className={styles.infoValue}>2 Sec/Rating</span>
              </div>
            </div>

            <div className={styles.heroButtons}>
              <Link href="/dashboard" className={styles.btnDashboard}>
                <span className={styles.btnIcon}>📊</span>
                <span>Dashboard</span>
              </Link>
              <a href="#features" className={styles.btnLearn}>
                Learn More
              </a>
            </div>

            <div className={styles.ticketFooter}>
              10K+ SHOWS RATED • 2K+ USERS
            </div>
          </div>

        </div>
      </section>

      {/* Trending Now Section */}
      <section className={styles.trendingSection}>
        <div className={styles.trendingHeader}>
          <div className={styles.marqueeTop}></div>
          <h2 className={styles.sectionTitle}>TRENDING NOW</h2>
          <div className={styles.marqueeBottom}></div>
        </div>

        <div className={styles.trendingGrid}>
          
          {/* Netflix Trending */}
          <div className={styles.trendingCard}>
            <div className={styles.trendingBadge}>LIVE</div>
            <div className={styles.platformLogo}>
              <div className={styles.netflixLogo}>N</div>
            </div>
            <h3 className={styles.platformName}>Netflix</h3>
            <div className={styles.trendingList}>
              <div className={styles.trendingItem}>
                <span className={styles.trendingRank}>#1</span>
                <span className={styles.trendingShow}>Loading...</span>
              </div>
              <div className={styles.trendingItem}>
                <span className={styles.trendingRank}>#2</span>
                <span className={styles.trendingShow}>Loading...</span>
              </div>
              <div className={styles.trendingItem}>
                <span className={styles.trendingRank}>#3</span>
                <span className={styles.trendingShow}>Loading...</span>
              </div>
            </div>
            <div className={styles.comingSoonTag}>Data Coming Soon</div>
          </div>

          {/* Hotstar Trending */}
          <div className={styles.trendingCard}>
            <div className={styles.trendingBadge}>LIVE</div>
            <div className={styles.platformLogo}>
              <div className={styles.hotstarLogo}>⭐</div>
            </div>
            <h3 className={styles.platformName}>Hotstar</h3>
            <div className={styles.trendingList}>
              <div className={styles.trendingItem}>
                <span className={styles.trendingRank}>#1</span>
                <span className={styles.trendingShow}>Loading...</span>
              </div>
              <div className={styles.trendingItem}>
                <span className={styles.trendingRank}>#2</span>
                <span className={styles.trendingShow}>Loading...</span>
              </div>
              <div className={styles.trendingItem}>
                <span className={styles.trendingRank}>#3</span>
                <span className={styles.trendingShow}>Loading...</span>
              </div>
            </div>
            <div className={styles.comingSoonTag}>Data Coming Soon</div>
          </div>

          {/* Prime Video Trending */}
          <div className={styles.trendingCard}>
            <div className={styles.trendingBadge}>LIVE</div>
            <div className={styles.platformLogo}>
              <div className={styles.primeLogo}>prime</div>
            </div>
            <h3 className={styles.platformName}>Prime Video</h3>
            <div className={styles.trendingList}>
              <div className={styles.trendingItem}>
                <span className={styles.trendingRank}>#1</span>
                <span className={styles.trendingShow}>Loading...</span>
              </div>
              <div className={styles.trendingItem}>
                <span className={styles.trendingRank}>#2</span>
                <span className={styles.trendingShow}>Loading...</span>
              </div>
              <div className={styles.trendingItem}>
                <span className={styles.trendingRank}>#3</span>
                <span className={styles.trendingShow}>Loading...</span>
              </div>
            </div>
            <div className={styles.comingSoonTag}>Data Coming Soon</div>
          </div>

        </div>
      </section>

      {/* Now Playing - Features */}
      <section className={styles.nowPlaying} id="features">
        <div className={styles.theaterSign}>
          <div className={styles.signBorder}></div>
          <h2 className={styles.sectionTitle}>FEATURES</h2>
          <div className={styles.signBorder}></div>
        </div>

        <div className={styles.featureGrid}>
          
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>⚡</div>
            <h3 className={styles.featureTitle}>QUICK RATING</h3>
            <p className={styles.featureDesc}>
              Popup appears when episode ends. Rate in 2 seconds.
            </p>
          </div>

          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>📊</div>
            <h3 className={styles.featureTitle}>TRACK SHOWS</h3>
            <p className={styles.featureDesc}>
              Beautiful dashboard for all your ratings and history.
            </p>
          </div>

          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>🌍</div>
            <h3 className={styles.featureTitle}>COMMUNITY</h3>
            <p className={styles.featureDesc}>
              See what others are watching and discover gems.
            </p>
          </div>

          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>🔒</div>
            <h3 className={styles.featureTitle}>PRIVATE</h3>
            <p className={styles.featureDesc}>
              Your data stays yours. No tracking, no selling.
            </p>
          </div>

          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>🎯</div>
            <h3 className={styles.featureTitle}>NEVER FORGET</h3>
            <p className={styles.featureDesc}>
              Remember which shows were worth it and which weren't.
            </p>
          </div>

          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>✨</div>
            <h3 className={styles.featureTitle}>CLEAN UI</h3>
            <p className={styles.featureDesc}>
              No clutter, no ads. Just clean interface that works.
            </p>
          </div>

        </div>
      </section>

      {/* How It Works */}
      <section className={styles.howItWorks}>
        <div className={styles.theaterSign}>
          <div className={styles.signBorder}></div>
          <h2 className={styles.sectionTitle}>HOW IT WORKS</h2>
          <div className={styles.signBorder}></div>
        </div>

        <div className={styles.stepsContainer}>
          
          <div className={styles.stepCard}>
            <div className={styles.stepNumber}>1</div>
            <div className={styles.stepIcon}>📥</div>
            <h3 className={styles.stepTitle}>Install</h3>
            <p className={styles.stepDesc}>Add extension to Chrome</p>
          </div>

          <div className={styles.stepArrow}>→</div>

          <div className={styles.stepCard}>
            <div className={styles.stepNumber}>2</div>
            <div className={styles.stepIcon}>🎬</div>
            <h3 className={styles.stepTitle}>Watch</h3>
            <p className={styles.stepDesc}>Binge your favorite shows</p>
          </div>

          <div className={styles.stepArrow}>→</div>

          <div className={styles.stepCard}>
            <div className={styles.stepNumber}>3</div>
            <div className={styles.stepIcon}>⭐</div>
            <h3 className={styles.stepTitle}>Rate</h3>
            <p className={styles.stepDesc}>Quick rating popup appears</p>
          </div>

        </div>
      </section>

      {/* Final CTA */}
      <section className={styles.finalCTA}>
        <div className={styles.ctaCard}>
          <div className={styles.ctaBadge}>
            <span>100%</span>
            <span>FREE</span>
          </div>
          
          <h2 className={styles.ctaTitle}>Ready to Start?</h2>
          <p className={styles.ctaSubtitle}>
            Join 2K+ binge-watchers who never forget a rating
          </p>

          <a 
            href="https://chrome.google.com/webstore" 
            target="_blank"
            rel="noopener noreferrer"
            className={styles.ctaButton}
          >
            <span className={styles.ctaIcon}>⬇️</span>
            <span>DOWNLOAD EXTENSION</span>
          </a>

          <div className={styles.ctaFeatures}>
            <span>✓ Free Forever</span>
            <span>✓ No Credit Card</span>
            <span>✓ Privacy First</span>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.footerContent}>
          <div className={styles.footerTop}>
            <div className={styles.footerLogo}>
              <span className={styles.footerIcon}>🍿</span>
              <span className={styles.footerBrand}>POPCORN RATINGS</span>
            </div>
          </div>

          <div className={styles.footerLinks}>
            <div className={styles.linkColumn}>
              <h4>Product</h4>
              <a href="#features">Features</a>
              <a href="/dashboard">Dashboard</a>
              <a href="#how">How It Works</a>
            </div>
            <div className={styles.linkColumn}>
              <h4>Company</h4>
              <a href="/about">About</a>
              <a href="/privacy">Privacy</a>
              <a href="/terms">Terms</a>
            </div>
            <div className={styles.linkColumn}>
              <h4>Connect</h4>
              <a href="mailto:contact@popcornratings.com">Contact</a>
              <a href="https://github.com/VishokSharma/Popcorn-Ratings" target="_blank" rel="noopener noreferrer">
                GitHub
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer">
                Twitter
              </a>
            </div>
          </div>

          <div className={styles.footerBottom}>
            <p>© 2026 Popcorn Ratings • Made with 🍿</p>
          </div>
        </div>
      </footer>
    </main>
  )
}