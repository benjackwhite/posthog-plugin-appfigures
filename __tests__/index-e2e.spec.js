import { getMeta, resetMeta } from '@posthog/plugin-scaffold/test/utils'
import dotenv from 'dotenv'
import { expect } from '@jest/globals'

import { createMockCache } from './helpers.spec'
import { runEveryDay, runEveryHour } from '../index'

dotenv.config()

const GLOBAL_TIMEOUT = 30000

const { appfigures_username, appfigures_password, appfigures_client_key, appfigures_product_ids } = process.env

const itIfEnvExists = appfigures_password ? it : it.skip

describe('Posthog Plugin Appfigures (E2E)', () => {
    beforeEach(() => {
        jest.setTimeout(10000)

        const nDaysAgo = new Date()
        nDaysAgo.setDate(new Date().getDate() - 30)
        const nDaysAgoString = nDaysAgo.toISOString().split('T')[0]

        resetMeta({
            config: {
                appfigures_username,
                appfigures_password,
                appfigures_client_key,
                appfigures_product_ids,
                appfigures_start_date: nDaysAgoString,
            },
            cache: createMockCache(),
        })

        global.posthog = {
            capture: jest.fn(),
        }
    })

    describe('runEveryDay', () => {
        itIfEnvExists(
            'should load all values from appfigures',
            async () => {
                const productId = parseInt(appfigures_product_ids.split(',')[0])
                await runEveryDay(getMeta())

                expect(posthog.capture).toHaveBeenCalledWith('appfigures_sales', {
                    distinct_id: 'plugin-appfigures-sales',
                    date: expect.any(String),
                    timestamp: expect.any(String),

                    app_downloads: expect.any(Number),
                    app_returns: expect.any(Number),
                    app_returns_amount: expect.any(Number),
                    app_revenue: expect.any(Number),
                    business_downloads: expect.any(Number),
                    business_revenue: expect.any(Number),
                    downloads: expect.any(Number),
                    edu_downloads: expect.any(Number),
                    edu_revenue: expect.any(Number),
                    gift_redemptions: expect.any(Number),
                    gifts: expect.any(Number),
                    gross_app_returns_amount: expect.any(Number),
                    gross_app_revenue: expect.any(Number),
                    gross_business_revenue: expect.any(Number),
                    gross_edu_revenue: expect.any(Number),
                    gross_iap_returns_amount: expect.any(Number),
                    gross_iap_revenue: expect.any(Number),
                    gross_returns_amount: expect.any(Number),
                    gross_revenue: expect.any(Number),
                    gross_standard_revenue: expect.any(Number),
                    gross_subscription_returns_amount: expect.any(Number),
                    gross_subscription_revenue: expect.any(Number),
                    iap_amount: expect.any(Number),
                    iap_returns: expect.any(Number),
                    iap_returns_amount: expect.any(Number),
                    iap_revenue: expect.any(Number),
                    net_downloads: expect.any(Number),
                    product_id: productId,
                    promos: expect.any(Number),
                    re_downloads: expect.any(Number),
                    returns: expect.any(Number),
                    returns_amount: expect.any(Number),
                    revenue: expect.any(Number),
                    standard_downloads: expect.any(Number),
                    standard_revenue: expect.any(Number),
                    subscription_purchases: expect.any(Number),
                    subscription_returns: expect.any(Number),
                    subscription_returns_amount: expect.any(Number),
                    subscription_revenue: expect.any(Number),
                    uninstalls: expect.any(Number),
                    updates: expect.any(Number),
                })

                expect(posthog.capture).toHaveBeenCalledWith('appfigures_ratings', {
                    distinct_id: 'plugin-appfigures-ratings',
                    date: expect.any(String),
                    timestamp: expect.any(String),
                    product_id: productId,

                    average: expect.any(Number),
                    breakdown: expect.any(Array),
                    negative: expect.any(Number),
                    neutral: expect.any(Number),
                    new: expect.any(Array),
                    new_average: expect.any(String),
                    new_negative: expect.any(Number),
                    new_neutral: expect.any(Number),
                    new_positive: expect.any(Number),
                    new_total: expect.any(Number),
                    positive: expect.any(Number),
                    total: expect.any(Number),
                })

                expect(posthog.capture).toHaveBeenCalledWith('appfigures_revenue', {
                    distinct_id: 'plugin-appfigures-revenue',
                    date: expect.any(String),
                    timestamp: expect.any(String),
                    product_id: productId,

                    ads: expect.any(Number),
                    edu: expect.any(Number),
                    gross_edu: expect.any(Number),
                    gross_iap: expect.any(Number),
                    gross_returns: expect.any(Number),
                    gross_sales: expect.any(Number),
                    gross_subscriptions: expect.any(Number),
                    gross_total: expect.any(Number),
                    iap: expect.any(Number),
                    returns: expect.any(Number),
                    sales: expect.any(Number),
                    subscriptions: expect.any(Number),
                    total: expect.any(Number),
                })
            },
            GLOBAL_TIMEOUT
        )
    })

    describe('runEveryHour', () => {
        itIfEnvExists(
            'should load all reviews from appfigures',
            async () => {
                const productId = parseInt(appfigures_product_ids.split(',')[0])
                await runEveryHour(getMeta())

                expect(posthog.capture).toHaveBeenCalledWith('appfigures_review', {
                    distinct_id: 'plugin-appfigures-reviews',
                    date: expect.any(String),
                    timestamp: expect.any(String),
                    product: productId,
                    product_id: productId,

                    author: expect.any(String),
                    deleted: false,
                    has_response: false,
                    id: expect.any(String),
                    iso: expect.any(String),
                    original_review: expect.any(String),
                    original_title: expect.any(String),
                    predicted_langs: expect.any(Array),
                    product_name: expect.any(String),
                    review: expect.any(String),
                    stars: expect.any(Number),
                    store: expect.any(String),
                    title: expect.any(String),
                    vendor_id: expect.any(String),
                    version: expect.any(String),
                    weight: expect.any(Number),
                })
            },
            GLOBAL_TIMEOUT
        )
    })
})
