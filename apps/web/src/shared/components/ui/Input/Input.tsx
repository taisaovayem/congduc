import { Input as AntInput, InputProps as AntInputProps } from 'antd';

export type InputProps = AntInputProps;

export function Input(props: InputProps) {
  return <AntInput {...props} />;
}
