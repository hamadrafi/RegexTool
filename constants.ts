
import { RegexTemplate } from './types';

export const TEMPLATES: RegexTemplate[] = [
  {
    id: 'email',
    name: 'Email Address',
    pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$',
    description: 'email pattern.',
    category: 'Communication'
  },
  {
    id: 'phone-intl',
    name: 'Phone (Intl)',
    pattern: '^\\+?[1-9]\\d{1,14}$',
    description: 'International E.164 phone number format.',
    category: 'Communication'
  },
  {
    id: 'cnic-pk',
    name: 'CNIC (Pakistan)',
    pattern: '^\\d{5}-\\d{7}-\\d{1}$',
    description: 'National ID format for Pakistan (13 digits with dashes).',
    category: 'Identification'
  },
  {
    id: 'license-plate',
    name: 'License Plate',
    pattern: '^(ISB|LHR|KHI|RWP|FSD|PEW|QTA|MUL|GUJ|SKT|SGD|BWP|HYD|SUK|ABB)-[0-9]{1,4}$',
    description: 'General alphanumeric plate format (1-7 chars).',
    category: 'Identification'
  },
  {
    id: 'url',
    name: 'URL',
    pattern: '^(https?:\\/\\/)?([\\da-z.-]+)\\.([a-z.]{2,6})([\\/\\w .-]*)*\\/?$',
    description: 'Standard web URL pattern.',
    category: 'Web'
  },
  {
    id: 'password-strong',
    name: 'Strong Password',
    pattern: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$',
    description: 'Min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char.',
    category: 'Security'
  }
];
