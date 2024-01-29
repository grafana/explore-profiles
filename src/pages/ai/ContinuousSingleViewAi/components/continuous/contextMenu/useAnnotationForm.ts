import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { getUTCdate, timezoneToOffset } from '@pyroscope/util/formatDate';
import { format } from 'date-fns';
import { useForm } from 'react-hook-form';

interface UseAnnotationFormProps {
  timezone: 'browser' | 'utc';
  value: {
    content?: string;
    timestamp: number;
  };
}

const newAnnotationFormSchema = z.object({
  content: z.string().min(1, { message: 'Required' }),
});

export const useAnnotationForm = ({ value, timezone }: UseAnnotationFormProps) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setFocus,
  } = useForm({
    resolver: zodResolver(newAnnotationFormSchema),
    defaultValues: {
      content: value?.content,
      timestamp: format(getUTCdate(new Date(value?.timestamp * 1000), timezoneToOffset(timezone)), 'yyyy-MM-dd HH:mm'),
    },
  });

  return {
    register,
    handleSubmit,
    errors,
    setFocus,
  };
};
