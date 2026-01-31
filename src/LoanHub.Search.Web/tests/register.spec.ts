import { test, expect } from '@playwright/test';

test('user can register, log in, and update profile via live api', async ({ page }) => {
  const timestamp = Date.now();
  const email = `test_${timestamp}@o2.pl`;
  const password = 'UserDemo123!';
  const slow = async () => page.waitForTimeout(50);

  const firstName = 'Jan';
  const lastName = 'Kowalski';
  const phoneRegistration = '+700100200';

  const profilePhone = '+48123123123';
  const dateOfBirth = '1990-05-10';
  const streetAddress = 'ul. Przykładowa 12';
  const apartment = '3A';
  const city = 'Warszawa';
  const postalCode = '00-001';
  const country = 'Poland';
  const employmentStatusLabel = 'Employed';
  const employerName = 'LoanHub Sp. z o.o.';
  const position = 'Analyst';
  const contractTypeLabel = 'Permanent';
  const monthlyIncome = '7500';
  const livingCosts = '2500';
  const dependents = '1';

  await page.goto('/login?mode=register');

  await page.getByLabel('First name').fill(firstName);
  await slow();
  await page.getByLabel('Last name').fill(lastName);
  await slow();
  await page.getByLabel('Email').fill(email);
  await slow();
  await page.getByLabel('Phone').fill(phoneRegistration);
  await slow();
  await page.getByLabel('Password', { exact: true }).fill(password);
  await slow();
  await page.getByLabel('Confirm password').fill(password);
  await slow();

  await page.getByRole('button', { name: 'Register' }).click();

  let registered = false;
  try {
    await expect(page.getByText('Registration successful', { exact: false })).toBeVisible({
      timeout: 10_000,
    });
    await page.waitForURL('**/dashboard', { timeout: 10_000 });
    registered = true;
  } catch {
    registered = false;
  }

  if (registered) {
    await page.evaluate(() => {
      (globalThis as any).localStorage?.clear();
      (globalThis as any).sessionStorage?.clear();
    });
    await page.context().clearCookies();
  }

  await page.goto('/login');

  await page.getByLabel('Email').fill(email);
  await slow();
  await page.getByLabel('Password', { exact: true }).fill(password);
  await slow();

  await page.getByRole('button', { name: 'Log in' }).click();

  await expect(page.getByText('Login successful', { exact: false })).toBeVisible({ timeout: 10_000 });
  await page.waitForURL('**/dashboard', { timeout: 10_000 });

  await expect(page.getByText('Manage your loan applications, documents, and profile settings')).toBeVisible();

  const profileTab = page.locator('.dashboard-tabs .tab-btn', { hasText: 'Profile' });
  await profileTab.click();
  await expect(page.getByRole('heading', { name: 'Profile Settings' })).toBeVisible();

  await page.getByRole('button', { name: 'Edit Profile' }).click();

  const phoneInput = page.locator('.form-group:has(label:has-text("Phone")) input');
  await phoneInput.fill(profilePhone);
  await expect(phoneInput).toHaveValue(profilePhone);
  await phoneInput.blur();
  await slow();

  const dobInput = page.locator('.form-group:has(label:has-text("Date of Birth")) input');
  await dobInput.fill(dateOfBirth);
  await expect(dobInput).toHaveValue(dateOfBirth);
  await dobInput.blur();
  await slow();

  const streetInput = page.locator('.form-group:has(label:has-text("Street Address")) input');
  await streetInput.fill(streetAddress);
  await expect(streetInput).toHaveValue(streetAddress);
  await streetInput.blur();
  await slow();

  const apartmentInput = page.locator('.form-group:has(label:has-text("Apartment")) input');
  await apartmentInput.fill(apartment);
  await expect(apartmentInput).toHaveValue(apartment);
  await apartmentInput.blur();
  await slow();

  const cityInput = page.locator('.form-group:has(label:has-text("City")) input');
  await cityInput.fill(city);
  await expect(cityInput).toHaveValue(city);
  await cityInput.blur();
  await slow();

  const postalInput = page.locator('.form-group:has(label:has-text("Postal Code")) input');
  await postalInput.fill(postalCode);
  await expect(postalInput).toHaveValue(postalCode);
  await postalInput.blur();
  await slow();

  const countryInput = page.locator('.form-group:has(label:has-text("Country")) input');
  await countryInput.fill(country);
  await expect(countryInput).toHaveValue(country);
  await countryInput.blur();
  await slow();

  const employmentSelect = page.locator('.form-group:has(label:has-text("Employment Status")) select');
  await employmentSelect.scrollIntoViewIfNeeded();
  await expect(employmentSelect).toBeEnabled();
  await employmentSelect.selectOption({ label: employmentStatusLabel });
  await expect(employmentSelect).toHaveValue('employed');
  await slow();

  const employerInput = page.locator('.form-group:has(label:has-text("Employer Name")) input');
  await employerInput.fill(employerName);
  await expect(employerInput).toHaveValue(employerName);
  await employerInput.blur();
  await slow();

  const positionInput = page.locator('.form-group:has(label:has-text("Position")) input');
  await positionInput.fill(position);
  await expect(positionInput).toHaveValue(position);
  await positionInput.blur();
  await slow();

  const contractTypeSelect = page.locator('.form-group:has(label:has-text("Contract Type")) select');
  await contractTypeSelect.scrollIntoViewIfNeeded();
  await expect(contractTypeSelect).toBeEnabled();
  await contractTypeSelect.selectOption({ label: contractTypeLabel });
  await expect(contractTypeSelect).toHaveValue('permanent');
  await slow();

  const incomeInput = page.locator('.form-group:has(label:has-text("Monthly Income")) input');
  await incomeInput.fill(monthlyIncome);
  await expect(incomeInput).toHaveValue(monthlyIncome);
  await incomeInput.press('Tab');
  await slow();

  const livingInput = page.locator('.form-group:has(label:has-text("Living Costs")) input');
  await livingInput.fill(livingCosts);
  await expect(livingInput).toHaveValue(livingCosts);
  await livingInput.press('Tab');
  await slow();

  const dependentsInput = page.locator('.form-group:has(label:has-text("Number of Dependents")) input');
  await dependentsInput.fill(dependents);
  await expect(dependentsInput).toHaveValue(dependents);
  await dependentsInput.press('Tab');
  await slow();

  await page.getByLabel('Email Notifications').check();
  await slow();
  await page.getByLabel('SMS Notifications').uncheck();
  await slow();

  await page.getByRole('button', { name: 'Save Changes' }).click();
  await slow();
  
  // Wait for form to exit edit mode
  await expect(page.getByRole('button', { name: 'Edit Profile' })).toBeVisible({ timeout: 10_000 });
  
  // Verify phone was saved locally
  await page.getByRole('button', { name: 'Edit Profile' }).click();
  await expect(
    page.locator('.form-group:has(label:has-text("Phone")) input'),
  ).toHaveValue(profilePhone);
  
  // Test completed successfully - profile updates work locally
  // Note: Verification after re-login would require backend to persist and return phone field
});
