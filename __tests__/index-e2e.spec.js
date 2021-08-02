import { getMeta, resetMeta } from '@posthog/plugin-scaffold/test/utils'
import { runEveryHour } from '../index'

import dotenv from 'dotenv'
import { expect } from '@jest/globals'
dotenv.config()

const GLOBAL_TIMEOUT = 30000

const { appfigures_username, appfigures_password, appfigures_client_key, appfigures_product_ids } = process.env

const itIfEnvExists = appfigures_password ? it : it.skip

describe('Posthog Plugin Appfigures (E2E)', () => {
    beforeEach(() => {
        jest.setTimeout(10000)
        resetMeta({
            config: {
                appfigures_username,
                appfigures_password,
                appfigures_client_key,
                appfigures_product_ids,
                appfigures_start_date: '2021-07-01',
            },
        })

        global.posthog = {
            capture: jest.fn(),
        }
    })

    describe('runEveryHour', () => {
        itIfEnvExists(
            'should load all values from appfigures',
            async () => {
                const productId = parseInt(appfigures_product_ids.split(',')[0])
                await runEveryHour(getMeta())

                expect(posthog.capture).toHaveBeenCalledWith('appfigures_sales', {
                    app_downloads: expect.any(Number),
                    app_returns: expect.any(Number),
                    app_returns_amount: expect.any(String),
                    app_revenue: expect.any(String),
                    business_downloads: expect.any(Number),
                    business_revenue: expect.any(String),
                    date: expect.any(String),
                    downloads: expect.any(Number),
                    edu_downloads: expect.any(Number),
                    edu_revenue: expect.any(String),
                    gift_redemptions: expect.any(Number),
                    gifts: expect.any(Number),
                    gross_app_returns_amount: expect.any(String),
                    gross_app_revenue: expect.any(String),
                    gross_business_revenue: expect.any(String),
                    gross_edu_revenue: expect.any(String),
                    gross_iap_returns_amount: expect.any(String),
                    gross_iap_revenue: expect.any(String),
                    gross_returns_amount: expect.any(String),
                    gross_revenue: expect.any(String),
                    gross_standard_revenue: expect.any(String),
                    gross_subscription_returns_amount: expect.any(String),
                    gross_subscription_revenue: expect.any(String),
                    iap_amount: expect.any(Number),
                    iap_returns: expect.any(Number),
                    iap_returns_amount: expect.any(String),
                    iap_revenue: expect.any(String),
                    net_downloads: expect.any(Number),
                    product_id: productId,
                    promos: expect.any(Number),
                    re_downloads: expect.any(Number),
                    returns: expect.any(Number),
                    returns_amount: expect.any(String),
                    revenue: expect.any(String),
                    standard_downloads: expect.any(Number),
                    standard_revenue: expect.any(String),
                    subscription_purchases: expect.any(Number),
                    subscription_returns: expect.any(Number),
                    subscription_returns_amount: expect.any(String),
                    subscription_revenue: expect.any(String),
                    uninstalls: expect.any(Number),
                    updates: expect.any(Number),
                })

                expect(posthog.capture).toHaveBeenCalledWith('appfigures_ratings', {
                    product_id: productId,
                    average: expect.any(String),
                    breakdown: expect.any(Array),
                    date: expect.any(String),
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
                    product_id: productId,
                    ads: expect.any(String),
                    date: expect.any(String),
                    edu: expect.any(String),
                    gross_edu: expect.any(String),
                    gross_iap: expect.any(String),
                    gross_returns: expect.any(String),
                    gross_sales: expect.any(String),
                    gross_subscriptions: expect.any(String),
                    gross_total: expect.any(String),
                    iap: expect.any(String),
                    returns: expect.any(String),
                    sales: expect.any(String),
                    subscriptions: expect.any(String),
                    total: expect.any(String),
                })

                expect(posthog.capture).toHaveBeenCalledWith('appfigures_review', {
                    author: expect.any(String),
                    date: expect.any(String),
                    deleted: false,
                    has_response: false,
                    id: expect.any(String),
                    iso: expect.any(String),
                    original_review: expect.any(String),
                    original_title: expect.any(String),
                    predicted_langs: expect.any(Array),
                    product: productId,
                    product_id: productId,
                    product_name: expect.any(String),
                    review: expect.any(String),
                    stars: expect.any(String),
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
