export const authFormSchemas = {
  login: {
    email: {
      label: 'Email',
      required: true,
      type: 'email',
    },
    password: {
      label: 'Password',
      required: true,
      minLength: 1,
    },
  },
  register: {
    name: {
      label: 'Full Name',
      required: true,
      minLength: 1,
    },
    companyName: {
      label: 'Company Name',
      required: true,
      minLength: 1,
    },
    phone: {
      label: 'Phone Number',
      required: true,
      minLength: 8,
    },
    email: {
      label: 'Email',
      required: true,
      type: 'email',
    },
    password: {
      label: 'Password',
      required: true,
      minLength: 6,
    },
    otp: {
      label: 'Phone OTP',
      required: true,
      minLength: 4,
      maxLength: 8,
    },
  },
};

