import fetch from 'node-fetch'

const APPFIGURES_URL = 'http://api.appfigures.com/v2'
const APPFIGURES_METRICS = ['sales', 'revenue', 'ratings']
const APPFIGURES_DEFAULT_START_DATE = '2020-01-01'
const DISTINCT_ID_PREFIX = 'plugin-appfigures'

const REDIS_PREFIX_LIST = (key) => `af-list-${key}`
const REDIS_PREFIX_LAST_SYNC = (key) => `af-last-sync-${key}`

// NOTE: This function converts all currencies from strings keys to integers so that Posthog is able to perform math
const CURRENCY_REGEX = /^\d+\.\d+$/
const _enrichCurrencies = (payload) => {
    Object.keys(payload).forEach((key) => {
        if (payload.hasOwnProperty(key) && CURRENCY_REGEX.test(payload[key])) {
            payload[key] = parseFloat(payload[key])
        }
    })

    return payload
}

const _request = async (config, path) => {
    const apiUrl = `${APPFIGURES_URL}${path}`
    const auth = Buffer.from(config.appfigures_username + ':' + config.appfigures_password).toString('base64')

    const res = await fetch(apiUrl, {
        headers: {
            Authorization: `Basic ${auth}`,
            'X-Client-Key': config.appfigures_client_key,
        },
    })

    return await res.json()
}

const _getDefaultStartDate = (config) => {
    return config.appfigures_start_date || APPFIGURES_DEFAULT_START_DATE
}

const _sync_appfigures_metric = async (plugin, metric, products) => {
    const { config, cache } = plugin

    const listKey = REDIS_PREFIX_LIST(metric)
    const lastSyncKey = REDIS_PREFIX_LAST_SYNC(metric)

    const ingestedDatesLength = await cache.llen(listKey)
    const ingestedDates = (await cache.lrange(listKey, 0, ingestedDatesLength)) || []
    const latestIngestedDate = (await cache.get(lastSyncKey)) || _getDefaultStartDate(config)

    const todaysDate = new Date().toISOString().split('T')[0]
    const yesterday = new Date()
    yesterday.setDate(new Date().getDate() - 1)
    const yesterdaysDate = yesterday.toISOString().split('T')[0]

    const res = await _request(
        config,
        `/reports/${metric}?products=${products}&group_by=products,dates&granularity=daily&start_date=${latestIngestedDate}`
    )

    for (const productId in res) {
        for (const date in res[productId]) {
            if (date === todaysDate) {
                // NOTE: We don't ingest for todays date as the values won't be complete yet...
                continue
            }

            const cacheValue = `${productId}-${date}`

            if (ingestedDates.includes(cacheValue)) {
                console.log(`Metric ${metric} ${cacheValue} already ingested.`)
                continue
            }
            posthog.capture(`appfigures_${metric}`, {
                ..._enrichCurrencies(res[productId][date]),
                timestamp: `${date}T12:00:00`,
                distinct_id: `${DISTINCT_ID_PREFIX}-${metric}`,
            })
            await cache.lpush(listKey, [cacheValue])
        }
    }

    await cache.set(lastSyncKey, yesterdaysDate)
}

const _sync_appfigures_reviews = async (plugin, products) => {
    const { config, cache } = plugin

    const listKey = REDIS_PREFIX_LIST('reviews')
    const lastSyncKey = REDIS_PREFIX_LAST_SYNC('reviews')

    const ingestedReviewsLength = await cache.llen(listKey)
    const ingestedReviews = (await cache.lrange(listKey, 0, ingestedReviewsLength)) || []
    const latestIngestedDate = (await cache.get(lastSyncKey)) || _getDefaultStartDate(config)
    const todaysDate = new Date().toISOString().split('T')[0]

    let currentPage = 0
    let moreToLoad = true

    while (moreToLoad) {
        currentPage += 1

        const path = `/reviews?page=${currentPage}&products=${products}&count=250&start=${latestIngestedDate}`
        console.log(`Loading reviews: ${path}`)

        const res = await _request(config, path)

        // Res: { 'total': 27, 'pages': 1, 'this_page': 1, 'reviews': [...] }

        if (res['this_page'] < res['pages']) {
            moreToLoad = true
            currentPage = res['this_page']
        }

        moreToLoad = false

        for (const values of res['reviews']) {
            const reviewId = values['id']
            if (ingestedReviews.includes(reviewId)) {
                console.log(`Review ID ${reviewId} already ingested.`)
                continue
            }

            console.log(`Ingesting Review ID ${reviewId}...`)
            posthog.capture(`appfigures_review`, {
                ..._enrichCurrencies(values),
                timestamp: values['date'],
                distinct_id: `${DISTINCT_ID_PREFIX}-reviews`,
            })

            await cache.lpush(listKey, [reviewId])
        }
    }

    await cache.set(lastSyncKey, todaysDate)
}

export async function runEveryHour(plugin) {
    const products = plugin.config.appfigures_product_ids
    await _sync_appfigures_reviews(plugin, products)
}

export async function runEveryDay(plugin) {
    const products = plugin.config.appfigures_product_ids
    for (const metric of APPFIGURES_METRICS) {
        await _sync_appfigures_metric(plugin, metric, products)
    }
}
