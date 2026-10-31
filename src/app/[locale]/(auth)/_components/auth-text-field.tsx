import { Control, Controller, FieldValues, Path } from "react-hook-form";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

export default function AuthTextField<T extends FieldValues>({
  control,
  name,
  label,
  type = "text",
  autoComplete,
}: {
  control: Control<T>;
  name: Path<T>;
  label: string;
  type?: "text" | "email" | "password";
  autoComplete: string;
}) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Field className="gap-1" data-invalid={fieldState.invalid}>
          <FieldLabel htmlFor={`auth-${name}`}>{label}</FieldLabel>
          <Input
            id={`auth-${name}`}
            {...field}
            type={type}
            autoComplete={autoComplete}
            autoCapitalize="off"
            spellCheck={false}
            aria-invalid={fieldState.invalid}
          />
          <FieldError errors={[fieldState.error]} />
        </Field>
      )}
    />
  );
}
