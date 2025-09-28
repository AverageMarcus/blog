var module=module?module:{};
function hljsDefinePromQL(hljs){
  const terms = ['avg', 'bottomk', 'count', 'count_values', 'group', 'limitk', 'limit_ratio', 'max', 'min', 'quantile', 'stddev', 'stdvar', 'sum', 'topk', 'abs', 'absent', 'absent_over_time', 'acos', 'acosh', 'asin', 'asinh', 'atan', 'atanh', 'avg_over_time', 'ceil', 'changes', 'clamp', 'clamp_max', 'clamp_min', 'cos', 'cosh', 'count_over_time', 'days_in_month', 'day_of_month', 'day_of_week', 'day_of_year', 'deg', 'delta', 'deriv', 'exp', 'floor', 'histogram_avg', 'histogram_count', 'histogram_fraction', 'histogram_quantile', 'histogram_sum', 'histogram_stddev', 'histogram_stdvar', 'double_exponential_smoothing', 'hour', 'idelta', 'increase', 'info', 'irate', 'label_replace', 'label_join', 'last_over_time', 'ln', 'log10', 'log2', 'mad_over_time', 'max_over_time', 'min_over_time', 'ts_of_max_over_time', 'ts_of_min_over_time', 'ts_of_last_over_time', 'minute', 'month', 'pi', 'predict_linear', 'present_over_time', 'quantile_over_time', 'rad', 'rate', 'resets', 'round', 'scalar', 'sgn', 'sin', 'sinh', 'sort', 'sort_desc', 'sort_by_label', 'sort_by_label_desc', 'sqrt', 'stddev_over_time', 'stdvar_over_time', 'sum_over_time', 'tan', 'tanh', 'time', 'timestamp', 'vector', 'year', 'on', 'ignoring', 'group_left', 'group_right', 'start()', 'end()', 'by', 'without', 'nan', 'inf'];
  const DURATION_MODE = {
    scope: 'number',
    match: new RegExp(`\\d+[${['y','w','d','h','m','s','ms'].join()}]`)
  };
  return {
    name: "PromQL",
    aliases: "promql prom prometheus",
    keywords: terms,
    contains: [
      hljs.COMMENT('#', '$'),
      hljs.QUOTE_STRING_MODE,
      DURATION_MODE,
      hljs.NUMBER_MODE
    ]
  };
}
module.exports=function(hljs){hljs.registerLanguage('promql',hljsDefinePromQL)};
module.exports.definer=hljsDefinePromQL;

