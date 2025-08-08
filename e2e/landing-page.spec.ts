/**
 * E2E tests for SecCheck Landing Page
 * Tests the actual landing page elements and functionality
 */
import { test, expect } from '@playwright/test'

test.describe('SecCheck Landing Page', () => {
  test('has correct title and loads successfully', async ({ page }) => {
    await page.goto('/')

    // Expect page title to contain "SecCheck" 
    await expect(page).toHaveTitle(/SecCheck/)
    
    // Check that the main SecCheck logo/heading is visible
    const logoHeading = page.getByText('SecCheck').first()
    await expect(logoHeading).toBeVisible()
  })

  test('displays hero section with main CTA', async ({ page }) => {
    await page.goto('/')

    // Check for hero content - main heading
    const mainHeading = page.getByText('Secure Your Web')
    await expect(mainHeading).toBeVisible()
    
    const subHeading = page.getByText('In Seconds')
    await expect(subHeading).toBeVisible()

    // Check for call-to-action button - should be "Start Scan"
    const ctaButton = page.getByRole('button', { name: /start scan/i })
    await expect(ctaButton).toBeVisible()
    
    // Check for URL input
    const urlInput = page.getByPlaceholder('https://example.com')
    await expect(urlInput).toBeVisible()
  })

  test('navigation links are accessible', async ({ page, isMobile }) => {
    await page.goto('/')

    // Check navigation exists
    const nav = page.locator('nav')
    await expect(nav).toBeVisible()

    if (!isMobile) {
      // Desktop navigation - use more specific selectors and wait for visibility
      await page.waitForLoadState('networkidle')
      
      const howItWorksLink = page.getByRole('link', { name: /how it works/i }).first()
      const pricingLink = page.getByRole('link', { name: /pricing/i }).first()
      const faqLink = page.getByRole('link', { name: /faq/i }).first()
      
      // Use more generous timeouts for these elements
      await expect(howItWorksLink).toBeVisible({ timeout: 10000 })
      await expect(pricingLink).toBeVisible({ timeout: 10000 })
      await expect(faqLink).toBeVisible({ timeout: 10000 })
    } else {
      // Mobile navigation might be behind a hamburger menu
      const mobileMenuButton = page.getByRole('button', { name: /menu/i })
      if (await mobileMenuButton.isVisible()) {
        await mobileMenuButton.click()
        await expect(page.getByText('How it Works')).toBeVisible({ timeout: 10000 })
      } else {
        // If no mobile menu, skip this test
        test.skip()
      }
    }
    
    // Check auth buttons with more specific selectors
    const signInButton = page.getByRole('link', { name: /sign in/i })
    const tryFreeButton = page.getByRole('link', { name: 'Try for free' }).first()
    
    await expect(signInButton).toBeVisible({ timeout: 10000 })
    await expect(tryFreeButton).toBeVisible({ timeout: 10000 })
  })

  test('hero URL input functionality', async ({ page }) => {
    await page.goto('/')
    
    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle')
    
    const urlInput = page.getByPlaceholder('https://example.com')
    await expect(urlInput).toBeVisible({ timeout: 10000 })
    
    // Test that we can type in the URL input
    await urlInput.fill('https://example.com')
    await expect(urlInput).toHaveValue('https://example.com')
    
    const startScanButton = page.getByRole('button', { name: /start scan/i })
    await expect(startScanButton).toBeVisible({ timeout: 10000 })
    
    // Wait for button to be enabled (it might start disabled)
    await expect(startScanButton).toBeEnabled({ timeout: 10000 })
    
    // Click start scan button (should redirect to sign-up since not authenticated)
    await startScanButton.click()
    
    // Should redirect to sign-up page with URL as query parameter
    await expect(page).toHaveURL(/\/sign-up/, { timeout: 15000 })
  })

  test('responsive design works on mobile', async ({ page, isMobile }) => {
    if (!isMobile) {
      // Skip this test on desktop browsers
      test.skip()
    }

    await page.goto('/')

    // Check that hero section is visible on mobile using test id
    const heroSection = page.getByTestId('hero-section')
    await expect(heroSection).toBeVisible()
    
    // Check that URL input is accessible on mobile
    const urlInput = page.getByPlaceholder('https://example.com')
    await expect(urlInput).toBeVisible()

    // Verify mobile menu functionality
    const mobileMenuButton = page.getByRole('button', { name: /menu/i })
    if (await mobileMenuButton.isVisible()) {
      await mobileMenuButton.click()
      
      // After clicking, mobile nav items should be visible
      const mobileHowItWorks = page.getByText('How it Works')
      await expect(mobileHowItWorks).toBeVisible()
    }
  })

  test('displays key features and security info', async ({ page }) => {
    await page.goto('/')
    
    // Check for OWASP mention in hero subtitle - be more specific to avoid multiple matches
    const owaspText = page.getByTestId('hero-section').getByText(/OWASP Top 10/i).first()
    await expect(owaspText).toBeVisible()
    
    // Check for quick info indicators - be specific to avoid multiple matches
    const safeIndicator = page.getByTestId('hero-section').getByText('Safe & Non-invasive')
    const instantResults = page.getByText('Instant Results')
    
    await expect(safeIndicator).toBeVisible()
    await expect(instantResults).toBeVisible()
  })
})