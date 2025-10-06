




export const addMonths = (currentDate: Date, numMonthes) : Date => {
    const newDate = new Date(currentDate) ;  
    newDate.setMonth( newDate.getMonth() + numMonthes) ; 
    return newDate ; 
}