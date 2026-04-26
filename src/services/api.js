export {
  BASE_URL,
  SOCKET_URL,
  axiosInstance,
  apiWrapper,
  fetchWrapper,
  formatApiError,
  getSocketClient,
  getStoredAuthToken,
  whatsappApiMode,
  whatsappSendPath,
  whatsappProvider,
  whatsappGraphVersion,
  whatsappPhoneNumberId,
} from '../config/apiConfig';

export { default } from '../config/api';

export * from './customer/customers';