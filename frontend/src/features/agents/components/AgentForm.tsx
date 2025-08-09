import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useState } from 'react';
import { agentsApi } from '@/lib/api';
import Button from '@/components/ui/button';
import { Textarea } from '@/components/ui/Textarea';
import { Switch } from '@/components/ui/Switch';
import { Label } from '@/components/ui/Label';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/Input';

const widgetConfigSchema = z.object({
  primaryColor: z.string().default('#000000'),
  position: z.enum(['left', 'right']).default('right'),
  title: z.string().default('How can I help you?'),
  subtitle: z.string().default('Ask me anything'),
});

const agentFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().min(1, 'Description is required'),
  model: z.string().min(1, 'Model is required'),
  prompt: z.string().min(1, 'Prompt is required'),
  widgetConfig: widgetConfigSchema,
  welcomeMessage: z.string().default('Hello! How can I help you today?'),
  temperature: z.number().min(0).max(2).default(0.7),
  maxTokens: z.number().min(1).default(500),
  isActive: z.boolean().default(true),
}).required();

type AgentFormValues = z.infer<typeof agentFormSchema>;

interface FormFieldProps {
  label: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}

const FormField = ({ label, error, children, className }: FormFieldProps) => (
  <div className={cn('space-y-2', className)}>
    <Label>{label}</Label>
    {children}
    {error && <p className="text-sm text-red-500">{error}</p>}
  </div>
);

interface AgentFormProps {
  initialData?: Partial<AgentFormValues> & { id?: string };
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function AgentForm({ initialData, onSuccess, onCancel }: AgentFormProps) {
  const isEditMode = !!initialData?.id;
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const defaultValues: AgentFormValues = {
    name: '',
    description: '',
    model: 'gpt-4',
    prompt: '',
    widgetConfig: {
      primaryColor: '#000000',
      position: 'right',
      title: 'How can I help you?',
      subtitle: 'Ask me anything',
    },
    welcomeMessage: 'Hello! How can I help you today?',
    temperature: 0.7,
    maxTokens: 500,
    isActive: true,
    ...initialData,
  };

  const form = useForm<AgentFormValues>({
    resolver: zodResolver(agentFormSchema as any), // Type assertion to handle complex schema
    defaultValues,
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    setValue,
  } = form;

  const onSubmit = async (formData: AgentFormValues) => {
    try {
      setIsLoading(true);
      
      if (initialData?.id) {
        await agentsApi.updateAgent(initialData.id, formData);
        toast.success('Agent updated successfully');
      } else {
        await agentsApi.createAgent(formData);
        toast.success('Agent created successfully');
      }
      
      router.push('/agents');
      router.refresh();
      onSuccess?.();
    } catch (error) {
      console.error('Error saving agent:', error);
      toast.error('Failed to save agent');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-4">
        <FormField label="Name" error={errors.name?.message}>
          <Input
            placeholder="e.g. Customer Support Bot"
            required
            {...register('name')}
          />
        </FormField>

        <FormField label="Description" error={errors.description?.message}>
          <Textarea
            placeholder="Describe what this agent does..."
            rows={3}
            required
            {...register('description')}
          />
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            This will help you identify the agent in your dashboard.
          </p>
        </FormField>

        <FormField label="Welcome Message" error={errors.welcomeMessage?.message}>
          <Textarea
            placeholder="Hello! How can I help you today?"
            rows={2}
            {...register('welcomeMessage')}
          />
        </FormField>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="model"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Model
              <span className="text-red-500 ml-1">*</span>
            </label>
            <select
              id="model"
              {...register('model')}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="gpt-4">GPT-4</option>
              <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
              <option value="claude-2">Claude 2</option>
            </select>
            {errors.model && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors.model.message}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="temperature"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Temperature: {watch('temperature')}
            </label>
            <input
              id="temperature"
              type="range"
              min="0"
              max="2"
              step="0.1"
              {...register('temperature', { valueAsNumber: true })}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
            />
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
              <span>Precise</span>
              <span>Balanced</span>
              <span>Creative</span>
            </div>
          </div>
        </div>

        <FormField label="System Prompt" error={errors.prompt?.message}>
          <Textarea
            placeholder="You are a helpful customer support assistant..."
            rows={6}
            required
            {...register('prompt')}
          />
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Define how the AI should behave. Be specific about tone, knowledge boundaries, and response format.
          </p>
        </FormField>

        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
          <button
            type="button"
            className="flex items-center text-sm font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
            onClick={() => setShowAdvanced(!showAdvanced)}
          >
            {showAdvanced ? 'Hide' : 'Show'} advanced settings
            <svg
              className={`ml-1 h-4 w-4 transform transition-transform ${showAdvanced ? 'rotate-180' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>

          {showAdvanced && (
            <div className="mt-4 space-y-4 animate-fadeIn">
              <div>
                <label
                  htmlFor="maxTokens"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Max Tokens: {watch('maxTokens')}
                </label>
                <input
                  id="maxTokens"
                  type="range"
                  min="100"
                  max="4000"
                  step="100"
                  {...register('maxTokens', { valueAsNumber: true })}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Controls the maximum length of the AI's response.
                </p>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="isActive" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Active
                  </Label>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {watch('isActive') ? 'Agent is active and can be used' : 'Agent is inactive and will not respond'}
                  </p>
                </div>
                <Switch
                  id="isActive"
                  checked={watch('isActive')}
                  onCheckedChange={(checked) => setValue('isActive', checked)}
                />
              </div>

              <div className="space-y-4 pt-2">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Widget Appearance
                </h4>
                
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="widgetTitle"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                    >
                      Widget Title
                    </label>
                    <input
                      id="widgetTitle"
                      type="text"
                      {...register('widgetConfig.title')}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                  
                  <div>
                    <label
                      htmlFor="widgetSubtitle"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                    >
                      Widget Subtitle
                    </label>
                    <input
                      id="widgetSubtitle"
                      type="text"
                      {...register('widgetConfig.subtitle')}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="widgetPosition"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                    >
                      Position
                    </label>
                    <select
                      id="widgetPosition"
                      {...register('widgetConfig.position')}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    >
                      <option value="right">Bottom Right</option>
                      <option value="left">Bottom Left</option>
                    </select>
                  </div>
                  
                  <div>
                    <label
                      htmlFor="widgetColor"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                    >
                      Primary Color
                    </label>
                    <div className="flex items-center">
                      <input
                        id="widgetColor"
                        type="color"
                        {...register('widgetConfig.primaryColor')}
                        className="h-10 w-10 rounded-md border border-gray-300 cursor-pointer"
                      />
                      <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                        {watch('widgetConfig.primaryColor')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          variant="primary"
          disabled={isLoading}
          isLoading={isLoading}
          className="min-w-32"
        >
          {isEditMode ? 'Update Agent' : 'Create Agent'}
        </Button>
      </div>
    </form>
  );
}
