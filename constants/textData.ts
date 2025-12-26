const today = new Date().toDateString().slice(4);

export const title = {
    SAVE: ` Data for ${today} already exists.`,
    DELETE: `Are you Sure !`
}

export const description = {
    SAVE: `Saving will overwrite existing data for ${today}. Do you want to proceed?`,
    DELETE: `Do you want to delete the Item`
}