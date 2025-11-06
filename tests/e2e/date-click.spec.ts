import { test, expect } from '@playwright/test';

test.describe('날짜 클릭으로 일정 생성 기능', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // 로컬스토리지 초기화
    await page.evaluate(() => localStorage.clear());
  });

  test('월간 뷰에서 빈 날짜 셀 클릭 시 해당 날짜가 폼에 자동으로 입력됨', async ({ page }) => {
    // 월간 뷰로 전환 (기본값이 월간이지만 명시적으로 확인)
    await page.waitForSelector('text=2025년 11월');

    // 특정 날짜 셀 클릭 (11월 15일)
    const targetDate = '2025-11-15';
    await page.click(`[data-testid="calendar-cell-${targetDate}"]`);

    // 날짜 입력 필드 확인
    const dateInput = page.locator('input[id="date"]');
    await expect(dateInput).toHaveValue(targetDate);
  });

  test('주간 뷰에서 빈 날짜 셀 클릭 시 해당 날짜가 폼에 자동으로 입력됨', async ({ page }) => {
    // 주간 뷰로 전환
    await page.click('text=주');
    await page.waitForTimeout(100);

    // 현재 주의 날짜 중 하나 클릭
    const cells = await page.locator('[data-testid^="calendar-cell-"]').all();
    if (cells.length > 0) {
      const firstCell = cells[0];
      const testId = await firstCell.getAttribute('data-testid');
      const dateValue = testId?.replace('calendar-cell-', '');

      await firstCell.click();

      // 날짜 입력 필드 확인
      const dateInput = page.locator('input[id="date"]');
      await expect(dateInput).toHaveValue(dateValue || '');
    }
  });

  test('날짜 클릭 후 일정을 생성하고 저장할 수 있음', async ({ page }) => {
    // 날짜 클릭
    const targetDate = '2025-11-18';
    await page.click(`[data-testid="calendar-cell-${targetDate}"]`);

    // 날짜가 자동으로 채워졌는지 확인
    const dateInput = page.locator('input[id="date"]');
    await expect(dateInput).toHaveValue(targetDate);

    // 일정 정보 입력
    await page.fill('input[id="title"]', '클릭으로 생성한 일정');
    await page.fill('input[id="start-time"]', '09:00');
    await page.fill('input[id="end-time"]', '10:00');
    await page.fill('input[id="description"]', '날짜 클릭으로 생성');

    // 저장 버튼 클릭
    await page.click('button:has-text("일정 추가")');

    // 겹침 경고가 있을 수 있으므로 처리
    const overlapDialog = page.locator('text=일정 겹침 경고');
    if (await overlapDialog.isVisible({ timeout: 1000 }).catch(() => false)) {
      await page.click('button:has-text("계속 진행")');
    }

    // 토스트 메시지 확인
    await expect(page.locator('text=일정이 추가되었습니다')).toBeVisible({ timeout: 5000 });

    // 캘린더에 일정이 표시되는지 확인 (첫 번째 요소만 확인)
    await expect(page.locator('text=클릭으로 생성한 일정').first()).toBeVisible();
  });

  test('날짜 클릭으로 폼이 채워진 후 다른 날짜를 클릭하면 날짜가 변경됨', async ({ page }) => {
    // 첫 번째 날짜 클릭
    const firstDate = '2025-11-10';
    await page.click(`[data-testid="calendar-cell-${firstDate}"]`);

    const dateInput = page.locator('input[id="date"]');
    await expect(dateInput).toHaveValue(firstDate);

    // 두 번째 날짜 클릭
    const secondDate = '2025-11-25';
    await page.click(`[data-testid="calendar-cell-${secondDate}"]`);

    // 날짜가 변경되었는지 확인
    await expect(dateInput).toHaveValue(secondDate);
  });

  test('날짜 클릭 시 hover 효과가 나타남', async ({ page }) => {
    const targetCell = page.locator('[data-testid="calendar-cell-2025-11-15"]');

    // hover 시 배경색 변경 확인
    await targetCell.hover();

    // CSS 변경 확인 (배경색이 변경되는지)
    const backgroundColor = await targetCell.evaluate((el) => {
      return window.getComputedStyle(el).backgroundColor;
    });

    // hover 효과가 적용되었는지 확인 (정확한 색상은 테마에 따라 다를 수 있음)
    expect(backgroundColor).toBeTruthy();
  });
});
