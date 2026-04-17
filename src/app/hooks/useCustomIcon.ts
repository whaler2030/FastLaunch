import { useState, useEffect } from 'react';
import { getIconBase64 } from '../../api/icons';
import { isCustomIcon } from '../components/ui/utils';

export function useCustomIcon(icon: string, iconType?: 'lucide' | 'custom'): {
  loading: boolean;
  base64: string | null;
  isCustom: boolean;
} {
  const [loading, setLoading] = useState(false);
  const [base64, setBase64] = useState<string | null>(null);

  const isCustom = iconType === 'custom' || isCustomIcon(icon);

  useEffect(() => {
    if (isCustom && icon) {
      setLoading(true);
      getIconBase64(icon)
        .then((data) => setBase64(data))
        .catch(() => setBase64(null))
        .finally(() => setLoading(false));
    } else {
      setBase64(null);
      setLoading(false);
    }
  }, [icon, isCustom]);

  return { loading, base64, isCustom };
}