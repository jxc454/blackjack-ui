const domain = /^([a-z0-9])(([a-z0-9-]{1,61})?[a-z0-9]{1})?(\.[a-z0-9](([a-z0-9-]{1,61})?[a-z0-9]{1})?)?(\.[a-zA-Z]{2,4})+$/;
const ip = /^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}$/;

export enum IndicatorType {
  Ip = "Ip",
  Domain = "Domain",
  HostName = "HostName",
  Url = "Url",
  Unknown = "Unknown"
}

const isDomain = (value: string): boolean => domain.test(value);
const isIp = (value: string): boolean => ip.test(value);
const isUrl = (value: string): boolean => {
  return ["https://", "http://"]
    .map(
      prefix =>
        value.startsWith(prefix) && domain.test(value.slice(prefix.length))
    )
    .some(d => d);
};

const isHost = (value: string): boolean => {
  return isDomain(value) && value.indexOf(".") !== value.lastIndexOf(".");
};

const getType: (value: string) => IndicatorType = (value: string) => {
  if (isIp(value)) {
    return IndicatorType.Ip;
  }
  if (isUrl(value)) {
    return IndicatorType.Url;
  }
  if (isHost(value)) {
    return IndicatorType.HostName;
  }
  if (isDomain(value)) {
    return IndicatorType.Domain;
  }
  return IndicatorType.Unknown;
};

export default getType;
