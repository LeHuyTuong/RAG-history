export const unwrap = (response) => response?.data?.data ?? response?.data;


export const unwrapPage = (response) => {
    const data = unwrap(response);

    if (data?.meta || data?.result) {
        return {
            items: data?.result ?? [],
            page: data?.meta?.page ?? 1,
            size: data?.meta?.pageSize ?? 0,
            totalElements: data?.meta?.total ?? 0,
            totalPages: data?.meta?.pages ?? 0,
        };
    }

    return {
        items: data?.content ?? [],
        page: data?.page ?? 0,
        size: data?.size ?? 0,
        totalElements: data?.totalElements ?? 0,
        totalPages: data?.totalPages ?? 0,
    };
};

export const unwrapResult = (response) => {
    const data = unwrap(response);
    return data?.result ?? data?.content ?? data ?? [];
};

export const extractErrorMessage = (error, fallback = 'Có lỗi xảy ra, vui lòng thử lại.') => {
    if (!error?.response) return error?.message || fallback;
    const { data } = error.response;
    return (
        data?.message ||
        data?.error ||
        data?.data?.message ||
        (typeof data === 'string' ? data : null) ||
        fallback
    );
};