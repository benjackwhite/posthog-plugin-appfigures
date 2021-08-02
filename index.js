import fetch from 'node-fetch'

const APPFIGURES_URL = 'http://api.appfigures.com/v2'
const APPFIGURES_METRICS = ['sales', 'revenue', 'ratings']
const APPFIGURES_DEFAULT_START_DATE = '2021-07-01'

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
                ...res[productId][date],
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
                ...values,
            })
        }
    }
}

export async function runEveryHour({ config }) {
    const products = config.appfigures_product_ids
    for (const metric of APPFIGURES_METRICS) {
        await _sync_appfigures_metric(config, metric, products)
    }

    await _sync_appfigures_reviews(config, products)
}
