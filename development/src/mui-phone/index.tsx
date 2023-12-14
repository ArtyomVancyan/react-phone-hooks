import {ChangeEvent, forwardRef, KeyboardEvent, useCallback, useEffect, useMemo, useRef, useState} from "react";
import {InputAdornment, MenuItem, Select, TextField} from "@mui/material";

import {
	checkValidity,
	cleanInput,
	displayFormat,
	getCountry,
	getDefaultISO2Code,
	getMetadata,
	getRawValue,
	parsePhoneNumber,
	usePhone,
} from "react-phone-hooks";

import {injectMergedStyles} from "./styles";
import {PhoneInputProps, PhoneNumber} from "./types";

injectMergedStyles();

const PhoneInput = forwardRef(({
						value: initialValue = "",
						variant = undefined,
						searchVariant = undefined,
						country = getDefaultISO2Code(),
						enableSearch = false,
						disableDropdown = false,
						onlyCountries = [],
						excludeCountries = [],
						preferredCountries = [],
						searchNotFound = "No country found",
						searchPlaceholder = "Search country",
						onMount: handleMount = () => null,
						onInput: handleInput = () => null,
						onChange: handleChange = () => null,
						onKeyDown: handleKeyDown = () => null,
						...muiInputProps
					}: PhoneInputProps, ref: any) => {
	searchVariant = searchVariant || variant;
	const backRef = useRef<boolean>(false);
	const searchRef = useRef<boolean>(false);
	const initiatedRef = useRef<boolean>(false);
	const [query, setQuery] = useState<string>("");
	const [open, setOpen] = useState<boolean>(false);
	const [maxWidth, setMaxWidth] = useState<number>(0);
	const [countryCode, setCountryCode] = useState<string>(country);

	const {
		clean,
		value,
		format,
		metadata,
		setValue,
		countriesList,
	} = usePhone({
		query,
		country,
		countryCode,
		initialValue,
		onlyCountries,
		excludeCountries,
		preferredCountries,
	});

	const selectValue = useMemo(() => {
		let metadata = getMetadata(getRawValue(value), countriesList);
		metadata = metadata || getCountry(countryCode as any);
		return ({...metadata})?.[0] + ({...metadata})?.[2];
	}, [countriesList, countryCode, value])

	const onKeyDown = useCallback((event: KeyboardEvent<HTMLInputElement>) => {
		backRef.current = event.key === "Backspace";
		handleKeyDown(event);
	}, [handleKeyDown])

	const onChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
		const formattedNumber = displayFormat(clean(event.target.value).join(""));
		const phoneMetadata = parsePhoneNumber(formattedNumber, countriesList);
		setValue(formattedNumber);
		handleChange({...phoneMetadata, valid: (strict: boolean) => checkValidity(phoneMetadata, strict)}, event);
	}, [clean, countriesList, handleChange, setValue])

	const onInput = useCallback((event: ChangeEvent<HTMLInputElement>) => {
		handleInput(event);
		format(event);
	}, [format, handleInput])

	const onMount = useCallback((value: PhoneNumber) => {
		handleMount(value);
	}, [handleMount])

	useEffect(() => {
		if (initiatedRef.current) return;
		initiatedRef.current = true;
		let initialValue = getRawValue(value);
		if (!initialValue.startsWith(metadata?.[2] as string)) {
			initialValue = metadata?.[2] as string;
		}
		const formattedNumber = displayFormat(clean(initialValue).join(""));
		const phoneMetadata = parsePhoneNumber(formattedNumber, countriesList);
		onMount({...phoneMetadata, valid: (strict: boolean) => checkValidity(phoneMetadata, strict)});
		setCountryCode(phoneMetadata.isoCode as any);
		setValue(formattedNumber);
	}, [clean, countriesList, metadata, onMount, setValue, value])

	return (
		<div className="mui-phone-input-wrapper"
			 ref={node => setMaxWidth(node?.offsetWidth || 0)}>
			<Select
				open={open}
				variant={variant}
				value={selectValue}
				onClose={() => setOpen(searchRef.current)}
				style={{position: "absolute", top: 0, left: 0, visibility: "hidden", width: "100%", zIndex: -1}}
			>
				<div className="mui-phone-input-search-wrapper" onKeyDown={(e: any) => e.stopPropagation()}>
					{enableSearch && (
						<TextField
							type="search"
							value={query}
							variant={searchVariant}
							className="mui-phone-input-search"
							onChange={(e: any) => setQuery(e.target.value)}
							onBlur={() => searchRef.current = false}
							onFocus={() => searchRef.current = true}
						/>
					)}
					{countriesList.map(([iso, name, dial, mask]) => (
						<MenuItem
							disableRipple
							key={iso + mask}
							value={iso + dial}
							style={{maxWidth}}
							onClick={() => {
								const selectedOption = iso + dial;
								if (selectValue === selectedOption) return;
								setCountryCode(selectedOption.slice(0, 2));
								setValue(displayFormat(cleanInput(mask, mask).join("")));
							}}
							children={<div className="mui-phone-input-select-item">
								<div className={`flag ${iso}`}/>
								<div className="label">
									{name}&nbsp;{displayFormat(mask)}
								</div>
							</div>}
						/>
					))}
				</div>
			</Select>
			<TextField
				ref={ref}
				type="tel"
				value={value}
				variant={variant}
				onInput={onInput}
				onChange={onChange}
				onKeyDown={onKeyDown}
				InputProps={{
					startAdornment: (
						<InputAdornment position="start">
							<span
								style={{cursor: "pointer"}}
								onClick={() => setOpen(!open)}
							>
								<div className={`flag ${countryCode}`}/>
							</span>
						</InputAdornment>
					)
				}}
				{...muiInputProps}
			/>
		</div>
	)
})

export default PhoneInput;
