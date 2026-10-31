import { Input as AntInput, InputProps as AntInputProps } from 'antd';

export type InputProps = AntInputProps;

function InputComponent(props: InputProps) {
  return <AntInput {...props} />;
}

export const Input = Object.assign(InputComponent, {
  Password: AntInput.Password,
  TextArea: AntInput.TextArea,
  Search: AntInput.Search,
});
