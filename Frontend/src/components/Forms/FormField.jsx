import { Controller } from 'react-hook-form'
import Input from '../UI/Input'
import Select from '../UI/Select'
import Textarea from '../UI/Textarea'
import Checkbox from '../UI/Checkbox'
import Switch from '../UI/Switch'

const FormField = ({
  name,
  control,
  type = 'text',
  label,
  placeholder,
  required = false,
  options = [],
  rows,
  description,
  helperText,
  ...props
}) => {
  const renderField = ({ field, fieldState }) => {
    const commonProps = {
      ...field,
      ...props,
      label,
      required,
      error: fieldState.error?.message,
      helperText,
    }

    switch (type) {
      case 'select':
        return (
          <Select {...commonProps} placeholder={placeholder}>
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        )

      case 'textarea':
        return (
          <Textarea
            {...commonProps}
            placeholder={placeholder}
            rows={rows}
          />
        )

      case 'checkbox':
        return (
          <Checkbox
            {...commonProps}
            label={label}
            description={description}
            checked={field.value}
          />
        )

      case 'switch':
        return (
          <Switch
            {...commonProps}
            label={label}
            description={description}
            checked={field.value}
          />
        )

      default:
        return (
          <Input
            {...commonProps}
            type={type}
            placeholder={placeholder}
          />
        )
    }
  }

  return (
    <Controller
      name={name}
      control={control}
      render={renderField}
    />
  )
}

export default FormField