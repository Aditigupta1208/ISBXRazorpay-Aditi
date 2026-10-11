def open_row(pg, name):
    """Open a folded row on the dispute page (evidence, timeline, money, checklist, rule, safety)."""
    b = pg.locator(f'[data-row="{name}"] > button')
    if b.count() and b.first.get_attribute('aria-expanded') == 'false':
        b.first.click(); pg.wait_for_timeout(150)

def review(pg):
    """Open the response form on a Fight call (it no longer opens by itself)."""
    b = pg.get_by_role('button', name='Review response')
    if b.count() and b.first.get_attribute('aria-expanded') != 'true':
        b.first.click(); pg.wait_for_timeout(250)
