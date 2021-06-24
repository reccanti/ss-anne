/**
 * I just want to use objects for Select values. Is that so
 * much to ask for???
 *
 * @METEORCITY_CANDIDATE
 * - Need to make this entirely hook-based, so it isn't dependent on
 *   any particular UI theme
 * - Probably need to figure out that change event type
 */

import { Select, FormControl, InputLabel, MenuItem } from "@material-ui/core";

interface Props<DataType> {
  // these are all things that will be passed to the UI elements
  id: string;
  label: string;
  fullWidth?: boolean;

  // these are all things for interacting with complex data
  data: DataType[];
  getDisplayValue: (data: DataType) => string;
  getKeyValue: (data: DataType) => string | number;
  getValue: (data: DataType) => string | number;
  onChange: (data: DataType) => void;
  value: DataType;
}

export function BetterSelect<DataType extends object>(props: Props<DataType>) {
  const stuffLookup = new Map<string | number, DataType>();
  props.data.forEach((d) => {
    stuffLookup.set(props.getValue(d), d);
  });

  /**
   * @NOTE - this is bleh but the type for the Select component's
   * onChange function is stupid and I don't want to replicate it.
   * There'll be a value, so who cares
   *
   * ~reccanti 6/20/2021
   */
  const handleChange = (event: any) => {
    const value = event.target.value;
    const trueValue = stuffLookup.get(value) as DataType;
    props.onChange(trueValue);
  };

  return (
    <FormControl fullWidth={props.fullWidth ?? false}>
      <InputLabel htmlFor={props.id}>{props.label}</InputLabel>
      <Select
        id={props.id}
        value={props.getValue(props.value)}
        onChange={handleChange}
      >
        {props.data.map((d) => (
          <MenuItem key={props.getKeyValue(d)} value={props.getValue(d)}>
            {props.getDisplayValue(d)}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}
