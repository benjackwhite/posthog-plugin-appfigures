import fetch from 'node-fetch'

const APPFIGURES_URL = 'http://api.appfigures.com/v2'
const APPFIGURES_METRICS = ['sales', 'revenue', 'ratings']
const APPFIGURES_DEFAULT_START_DATE = '2021-07-01'
const DISTINCT_ID = 'plugin-appfigures'

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

const _sync_appfigures_metric = async (config, metric, products) => {
    const startDate = config.appfigures_start_date || APPFIGURES_DEFAULT_START_DATE
    const res = await _request(
        config,
        `/reports/${metric}?products=${products}&group_by=products,dates&granularity=daily&start_date=${startDate}`
    )

    for (const productId in res) {
        for (const date in res[productId]) {
            posthog.capture(`appfigures_${metric}`, {
                ..._enrichCurrencies(res[productId][date]),
                timestamp: `${date}T12:00:00`,
                distinct_id: DISTINCT_ID,
            })
        }
    }
}

const _sync_appfigures_reviews = async (config, products) => {
    const startDate = config.appfigures_start_date || APPFIGURES_DEFAULT_START_DATE

    let currentPage = 0
    let moreToLoad = true

    while (moreToLoad) {
        currentPage += 1

        const res = await _request(
            config,
            `/reviews?page=${currentPage}&products=${products}&count=250&start=${startDate}`
        )

        // Res: { 'total': 27, 'pages': 1, 'this_page': 1, 'reviews': [...] }

        if (res['this_page'] < res['pages']) {
            moreToLoad = true
            currentPage = res['this_page']
        }

        moreToLoad = false

        for (const values of res['reviews']) {
            posthog.capture(`appfigures_review`, {
                ..._enrichCurrencies(values),
                timestamp: values['date'],
                distinct_id: DISTINCT_ID,
            })
        }
    }
}

export async function runEveryDay({ config }) {
    const products = config.appfigures_product_ids
    for (const metric of APPFIGURES_METRICS) {
        await _sync_appfigures_metric(config, metric, products)
    }

    await _sync_appfigures_reviews(config, products)
}
