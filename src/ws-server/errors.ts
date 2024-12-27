import { type IErrorMessage } from "@abybylijedno/songbook-protocol";

export class ErrorMessage extends Error implements IErrorMessage {
  constructor(public code: number, public text: string) {
    super(text);
  }
}

export const Errors = {
  UNKNOWN_ERROR                         : new ErrorMessage(1, "Nieznany błąd"),
  UNKNOWN_COMMAND                       : new ErrorMessage(2, "Nieznana komenda"),

  SESSION_WITH_GIVEN_ID_DOES_NOT_EXIST  : new ErrorMessage(100, "Sesja o podanym ID nie istnieje"),
  SESSION_ID_IS_NOT_PROVIDED            : new ErrorMessage(101, "Nie podano ID sesji"),

  YOU_HAVE_NO_SESSION                   : new ErrorMessage(110, "Nie masz żadnej sesji"),
  YOU_ARE_NOT_CREATOR                   : new ErrorMessage(111, "Nie jesteś twórcą sesji"),
  YOU_HAVE_SESSION_ALREADY              : new ErrorMessage(112, "Stworzyłeś/aś już inną sesję"),
  YOU_ARE_MEMBER_OF_SESSION             : new ErrorMessage(113, "Jesteś uczestnikiem innej sesji"),

  USER_NOT_FOUND_IN_SESSION             : new ErrorMessage(120, "Nie znaleziono użytkownika w sesji"),

  CANNOT_REMOVE_CREATOR                 : new ErrorMessage(130, "Nie możesz usunąć twórcy sesji"),
  CANNOT_LEAVE_SESSION_AS_CREATOR       : new ErrorMessage(131, "Nie możesz opuścić sesji, ponieważ jesteś jej twórcą"),                  
    
};
