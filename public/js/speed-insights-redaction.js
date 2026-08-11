window.speedInsightsBeforeSend = function (data) {
    if (data && data.attribution && data.attribution.eventTarget) {
        data.attribution.eventTarget = '[redacted]';
    }
    return data;
};
