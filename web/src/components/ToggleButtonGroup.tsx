interface ToggleOption<T extends string> {
  value: T
  label: string
}

interface ToggleButtonGroupProps<T extends string> {
  options: ToggleOption<T>[]
  value: T
  onChange: (value: T) => void
}

export default function ToggleButtonGroup<T extends string>({
  options,
  value,
  onChange,
}: ToggleButtonGroupProps<T>) {
  return (
    <div className="flex overflow-hidden rounded border border-gray-300 text-sm">
      {options.map(option => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={`px-3 py-1 transition-colors ${
            value === option.value
              ? 'bg-violet-500 text-white'
              : 'bg-white text-gray-600 hover:bg-gray-50'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
