




export const addMonths = (currentDate: Date, numMonthes) : Date => {
    const newDate = new Date(currentDate) ;  
    newDate.setMonth( newDate.getMonth() + numMonthes) ; 
    return newDate ; 
}


export function toLocalISODate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
