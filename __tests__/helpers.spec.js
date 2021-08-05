export const createMockCache = () => {
    const _ = {
        _data: {},
        get: (key, def) => _._data[key] || def,
        set: (key, val) => (_._data[key] = val),
        llen: (key) => (_._data[key] || []).length,
        lrange: (key, start, end) => (_._data[key] || []).slice(start, end),
        lpush: (key, val) => (_._data[key] ? _._data[key].push(...val) : (_._data[key] = [...val])),
    }

    return _
}

it('helps', () => {
    const cache = createMockCache()

    cache.set('does-it-help', 'yes it does!')

    expect(cache.get('does-it-help')).toEqual('yes it does!')
})
