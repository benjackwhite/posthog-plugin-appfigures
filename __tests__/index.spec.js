import { getMeta, resetMeta } from '@posthog/plugin-scaffold/test/utils'

jest.mock('node-fetch')

import fetch from 'node-fetch'

import { runEveryHour } from '../index'

import RATINGS_RESPONSE from '../__test_data__/ratings.json'
import REVENUE_RESPONSE from '../__test_data__/revenue.json'
import REVIEWS_RESPONSE from '../__test_data__/reviews.json'
import SALES_RESPONSE from '../__test_data__/sales.json'

describe('Posthog Plugin Appfigures (Unit)', () => {
    beforeEach(() => {
        resetMeta({
            config: {
                appfigures_username: 'test',
                appfigures_password: 'test',
                appfigures_client_key: 'test',
                appfigures_product_ids: 'app1,app2',
                appfigures_start_date: '2021-07-01',
            },
        })

        global.posthog = {
            capture: jest.fn(),
        }

        fetch.mockImplementation((url, options) => {
            let data = {}
            if (url.includes('/v2/reviews')) {
                data = REVIEWS_RESPONSE
            }
            if (url.includes('/v2/reports/ratings')) {
                data = RATINGS_RESPONSE
            }
            if (url.includes('/v2/reports/sales')) {
                data = SALES_RESPONSE
            }
            if (url.includes('/v2/reports/revenue')) {
                data = REVENUE_RESPONSE
            }

            return Promise.resolve({
                json: () => Promise.resolve(data),
            })
        })
    })

    describe('runEveryHour', () => {
        it('should load all values from appfigures', async () => {
            await runEveryHour(getMeta())

            const commonOptions = {
                headers: { Authorization: 'Basic dGVzdDp0ZXN0', 'X-Client-Key': 'test' },
            }

            expect(fetch).toHaveBeenCalledWith(
                'http://api.appfigures.com/v2/reports/sales?products=app1,app2&group_by=products,dates&granularity=daily&start_date=2021-07-01',
                commonOptions
            )

            expect(fetch).toHaveBeenCalledWith(
                'http://api.appfigures.com/v2/reports/revenue?products=app1,app2&group_by=products,dates&granularity=daily&start_date=2021-07-01',
                commonOptions
            )
            expect(fetch).toHaveBeenCalledWith(
                'http://api.appfigures.com/v2/reports/ratings?products=app1,app2&group_by=products,dates&granularity=daily&start_date=2021-07-01',
                commonOptions
            )

            expect(fetch).toHaveBeenCalledWith(
                'http://api.appfigures.com/v2/reviews?page=1&products=app1,app2&count=250&start=2021-07-01',
                commonOptions
            )

            expect(posthog.capture).toHaveBeenCalledTimes(8)

            expect(posthog.capture).toHaveBeenCalledWith('appfigures_review', {
                author: 'Tom Jones',
                date: '2021-07-01T16:11:17',
                deleted: false,
                has_response: false,
                id: '123456-1',
                iso: 'ZZ',
                original_review: 'Toll gemacht!',
                original_title: '',
                predicted_langs: ['de'],
                product: 123456,
                product_id: 123456,
                product_name: 'My Product',
                review: 'Toll gemacht!',
                stars: '5.00',
                store: 'google_play',
                title: '',
                vendor_id: 'com.product.mine',
                version: '1.2.3',
                weight: 0,
            })

            expect(posthog.capture).toHaveBeenCalledWith('appfigures_sales', {
                downloads: 33,
                re_downloads: 41,
                uninstalls: 8,
                updates: 1,
                returns: 0,
                net_downloads: 33,
                promos: 0,
                revenue: '0.00',
                returns_amount: '0.00',
                edu_downloads: 0,
                gifts: 0,
                gift_redemptions: 0,
                edu_revenue: '0.00',
                gross_revenue: '0.00',
                gross_returns_amount: '0.00',
                gross_edu_revenue: '0.00',
                business_downloads: 0,
                business_revenue: '0.00',
                gross_business_revenue: '0.00',
                standard_downloads: 33,
                standard_revenue: '0.00',
                gross_standard_revenue: '0.00',
                app_downloads: 33,
                app_returns: 0,
                iap_amount: 0,
                iap_returns: 0,
                subscription_purchases: 0,
                subscription_returns: 0,
                app_revenue: '0.00',
                app_returns_amount: '0.00',
                gross_app_revenue: '0.00',
                gross_app_returns_amount: '0.00',
                iap_revenue: '0.00',
                iap_returns_amount: '0.00',
                gross_iap_revenue: '0.00',
                gross_iap_returns_amount: '0.00',
                subscription_revenue: '0.00',
                subscription_returns_amount: '0.00',
                gross_subscription_revenue: '0.00',
                gross_subscription_returns_amount: '0.00',
                product_id: 123456,
                date: '2021-07-01',
            })

            expect(posthog.capture).toHaveBeenCalledWith('appfigures_revenue', {
                ads: '0.00',
                date: '2021-07-01',
                edu: '0.00',
                gross_edu: '0.00',
                gross_iap: '149.98',
                gross_returns: '0.00',
                gross_sales: '0.00',
                gross_subscriptions: '0.00',
                gross_total: '149.98',
                iap: '107.12',
                product_id: 123456,
                returns: '0.00',
                sales: '0.00',
                subscriptions: '0.00',
                total: '107.12',
            })

            expect(posthog.capture).toHaveBeenCalledWith('appfigures_ratings', {
                breakdown: [26, 30, 67, 187, 717],
                new: [0, 0, 0, 0, 0],
                average: '4.50',
                total: 1027,
                new_average: 'NaN',
                new_total: 0,
                positive: 904,
                negative: 56,
                neutral: 67,
                new_positive: 0,
                new_negative: 0,
                new_neutral: 0,
                product_id: 123456,
                date: '2021-07-01',
            })
        })
    })
})
