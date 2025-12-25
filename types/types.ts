export interface ReportData {
    // Same interface as before
    todaysDate: string;
    totalGrossIncome: string;
    calculatedNetIncome: string;
    month: string;
    all: list[];
    time: string;
}

export interface input {
    name: string;
    toggle: string;
}

export type list = {
    name: string;
    value: number;
};