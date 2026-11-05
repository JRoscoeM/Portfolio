// Skeleton written by Profs Zachary, Kopta and Martin for CS 3500
// Read the entire skeleton carefully and completely before you
// do anything else!
// Last updated: August 2023 (small tweak to API)

using System.ComponentModel.Design;
using System.Diagnostics.CodeAnalysis;
using System.Linq;
using System.Linq.Expressions;
using System.Reflection.Metadata.Ecma335;
using System.Text.RegularExpressions;
using System.Threading.Tasks;

namespace SpreadsheetUtilities;

/// <summary>
/// Represents formulas written in standard infix notation using standard precedence
/// rules.  The allowed symbols are non-negative numbers written using double-precision
/// floating-point syntax (without unary preceeding '-' or '+');
/// variables that consist of a letter or underscore followed by
/// zero or more letters, underscores, or digits; parentheses; and the four operator
/// symbols +, -, *, and /.
///
/// Spaces are significant only insofar that they delimit tokens.  For example, "xy" is
/// a single variable, "x y" consists of two variables "x" and y; "x23" is a single variable;
/// and "x 23" consists of a variable "x" and a number "23".
///
/// Associated with every formula are two delegates: a normalizer and a validator.  The
/// normalizer is used to convert variables into a canonical form. The validator is used to
/// add extra restrictions on the validity of a variable, beyond the base condition that
/// variables must always be legal: they must consist of a letter or underscore followed
/// by zero or more letters, underscores, or digits.
/// Their use is described in detail in the constructor and method comments.
/// </summary>
public class Formula
{
    //fields
    private Stack<double> valueStack = new Stack<double>();
    private Stack<string> operatorStack = new Stack<string>();
    private List<string> tokenList;
    

    //I created this default Function method to give normalizeFunc a default value
    // I did this because I couldn't get rid of a warning, but it shouldn't make a difference since
    // it will be overridden when in the constructor.
    private static string Function (string input)
    {
        return "";
    }
    private static Func<string, string> normalizeFunc
    {
        get; set;
    } = Function;
    private string formula
    {
        get; set;
    }

    private delegate int Lookup(String v);//TODO should this be private?
    /// <summary>
    /// Creates a Formula from a string that consists of an infix expression written as
    /// described in the class comment.  If the expression is syntactically invalid,
    /// throws a FormulaFormatException with an explanatory Message.
    ///
    /// The associated normalizer is the identity function, and the associated validator
    /// maps every string to true.
    /// </summary>
    public Formula(string formula) :
        this(formula, s => s, s => true)
    {
    }

    /// <summary>
    /// Creates a Formula from a string that consists of an infix expression written as
    /// described in the class comment.  If the expression is syntactically incorrect,
    /// throws a FormulaFormatException with an explanatory Message.
    ///
    /// The associated normalizer and validator are the second and third parameters,
    /// respectively.
    ///
    /// If the formula contains a variable v such that normalize(v) is not a legal variable,
    /// throws a FormulaFormatException with an explanatory message.
    ///
    /// If the formula contains a variable v such that isValid(normalize(v)) is false,
    /// throws a FormulaFormatException with an explanatory message.
    ///
    /// Suppose that N is a method that converts all the letters in a string to upper case, and
    /// that V is a method that returns true only if a string consists of one letter followed
    /// by one digit.  Then:
    ///
    /// new Formula("x2+y3", N, V) should succeed
    /// new Formula("x+y3", N, V) should throw an exception, since V(N("x")) is false
    /// new Formula("2x+y3", N, V) should throw an exception, since "2x+y3" is syntactically incorrect.
    /// </summary>
    public Formula(string formula, Func<string, string> normalize, Func<string, bool> isValid)
    {
        IsValidFormula(formula);//check for illegal variables and invalid syntaxes
        tokenList = GetTokens(formula).ToList();

        for(int i = 0;i < tokenList.Count;i++)
        {
            if (IsVar(tokenList[i]))// if it is a valid variable according to the general definition of a variable
            {
                tokenList[i] = normalize(tokenList[i]);
                if (!isValid(tokenList[i]))//check if the normalized variable is valid according to the passed validator
                    throw new FormulaFormatException("the normalized variable is not valid");
            }
        }

        normalizeFunc = normalize;
        this.formula = formula;
    }
    private bool IsValidFormula(string formula) 
    {
        List<string> list = GetTokens(formula).ToList();

        int openParen = 0;
        int closeParen = 0;
        int itr = 0;
        double result;

        if (formula[0] != '=')
        {
            throw new FormulaFormatException("first token in a formula must be the equals sign");

        }
        list.RemoveAt(0);
        if (!(list.Count >= 1))
        {
            throw new FormulaFormatException("there must be at least one token");
        }
        // check is valid starting token
        if (list[0] != "(" && !double.TryParse(list[0], out result) && !IsVar(list[0]))
            throw new FormulaFormatException("starting token must be either a opening parenthesis, number, or variable");

        // check that last is a valid ending token
        if(list[list.Count - 1] != ")" && !double.TryParse(list[list.Count - 1], out result) && !IsVar(list[list.Count - 1]) )
            throw new FormulaFormatException("last token must be either a closing parenthesis, number, or variable");

        foreach (string token in list)
        {
            //check if all tokens are valid
            if (!IsValidToken(token))
                throw new FormulaFormatException("The formula was created with invalid tokens. Valid tokens include operators, real numbers, and valid variables");
            
            if (token == "(") { openParen++; }
            if (token == ")") {  closeParen++; }

            //check that the number of closeParens is not greater than the number of openParens seen so far
            if (closeParen > openParen)
                throw new FormulaFormatException("the number of closing parentheses seen so far must not be greater than the number of openening parentheses seen so far");

            if (itr + 1 >= list.Count)
                continue;

            if (list[itr] == "(" || IsOperator(list[itr]))
                if (list[itr + 1] != "(" && !double.TryParse(list[itr + 1], out result) && !IsVar(list[itr + 1]))
                    throw new FormulaFormatException("Any token that immediately follows an opening parenthesis or an operator must be either a number, a variable, or an opening parenthesis.");
                
             if (list[itr] == ")" || double.TryParse(list[itr], out result) || IsVar(list[itr]))
                if (!IsOperator(list[itr + 1]) && list[itr + 1] != ")")
                    throw new FormulaFormatException("Any token that immediately follows a number, a variable, or a closing parenthesis must be either an operator or a closing parenthesis.Any token that immediately follows a number, a variable, or a closing parenthesis must be either an operator or a closing parenthesis.");
            itr++;
        }
        //check that the total number of closing and opening parentheses are equal
        if (openParen != closeParen)
            throw new FormulaFormatException("total number of closing and opening parentheses must be equal");

        return true;
    }
    /// <summary>
    /// private helper method for determining if a string is a valid token
    /// </summary>
    /// <param name="s"></param>
    /// <returns></returns>
    private bool IsValidToken(string s) //TODO scientific notation
    {
        double result;

        if (double.TryParse(s, out result) || IsVar(s) || IsOp(s))
            return true;
        return false;
    }
    /// <summary>
    /// private helper method for determining if a string is a valid variable
    /// </summary>
    /// <param name="s"></param>
    /// <returns></returns>
    private bool IsVar(string s)
    {
        string varPattern = "^[a-zA-Z_][a-zA-Z0-9_]*$";

        if (Regex.IsMatch(s, varPattern))
        {
            return true;
        }

        return false;
    }
    /// <summary>
    /// private helper method for determining if a string is a valid operator
    /// </summary>
    /// <param name="s"></param>
    /// <returns></returns>
    private static bool IsOp(string s)
    {
        if (s == "(")
            return true;
        else if (s == ")")
            return true;
        else if (s == "+")
            return true;
        else if (s == "-")
            return true;
        else if (s == "*")
            return true;
        else if (s == "/")
            return true;
        else
            return false;
    }
    /// <summary>
    /// helper method for determining if a string is either +, -, *, /
    /// </summary>
    /// <param name="s"></param>
    /// <returns></returns>
    private static bool IsOperator(string s)
    {
        if (s == "+")
            return true;
        else if (s == "-")
            return true;
        else if (s == "*")
            return true;
        else if (s == "/")
            return true;
        else
            return false;
    }

    /// <summary>
    /// Evaluates this Formula, using the lookup delegate to determine the values of
    /// variables.  When a variable symbol v needs to be determined, it should be looked up
    /// via lookup(normalize(v)). (Here, normalize is the normalizer that was passed to
    /// the constructor.)
    ///
    /// For example, if L("x") is 2, L("X") is 4, and N is a method that converts all the letters
    /// in a string to upper case:
    ///
    /// new Formula("x+7", N, s => true).Evaluate(L) is 11
    /// new Formula("x+7").Evaluate(L) is 9
    ///
    /// Given a variable symbol as its parameter, lookup returns the variable's value
    /// (if it has one) or throws an ArgumentException (otherwise).
    ///
    /// If no undefined variables or divisions by zero are encountered when evaluating
    /// this Formula, the value is returned.  Otherwise, a FormulaError is returned.
    /// The Reason property of the FormulaError should have a meaningful explanation.
    ///
    /// This method should never throw an exception.
    /// </summary>
    public object Evaluate(Func<string, double> lookup)
    {

        string trimmed = formula.Trim();// TODO is this necessary
        string[] substrings = Regex.Split(trimmed, "(\\()|(\\))|(-)|(\\+)|(\\*)|(/)");

        substrings[0] = substrings[0].Remove(0, 1);

        for (int i = 0; i < substrings.Length; i++)
        {
            substrings[i] = substrings[i].Trim();
        }
        
        for (int i = 0; i < substrings.Length; i++)
        {
            
            double result;

            // if the token at index i is an double
            if (double.TryParse(substrings[i], out result))
            {
                if (operatorStack.IsOnTop("*") || operatorStack.IsOnTop("/"))
                {
                    if (operatorStack.IsOnTop("/") && result == 0.0)
                    {
                        return new FormulaError("cannot divide by zero");
                    }

                    valueStack.Push(Calculate(valueStack.Pop(), operatorStack.Pop(), result));
                }
                else
                {

                    valueStack.Push(result);
                }
                continue;
            }
            // if the token at index i is a variable
            if (IsVar(substrings[i]))
            {
                try
                {
                    lookup(substrings[i]);
                }
                catch (Exception)
                {
                    return new FormulaError("variable is undefined");
                }
                if (operatorStack.IsOnTop("*") || operatorStack.IsOnTop("/"))
                {
                    
                    if (operatorStack.IsOnTop("/") && lookup(substrings[i]) == 0.0)
                        return new FormulaError("cannot divide by zero");
                    valueStack.Push(Calculate(valueStack.Pop(), operatorStack.Pop(), lookup(substrings[i])));
                }
                else
                {
                    valueStack.Push(lookup(substrings[i]));
                }
                continue;
            }
            if (substrings[i] == "+" || substrings[i] == "-")
            {
                if (operatorStack.IsOnTop("+") || operatorStack.IsOnTop("-"))
                {
                    valueStack.Push(Calculate(valueStack.Pop(), operatorStack.Pop(), valueStack.Pop()));
                }
                operatorStack.Push(substrings[i]);
                continue;
            }
            if (substrings[i] == "*" || substrings[i] == "/")
            {
                operatorStack.Push(substrings[i]);
                continue;
            }
            if (substrings[i] == "(")
            {
                operatorStack.Push(substrings[i]);
                continue;
            }
            if (substrings[i] == ")")
            {
                if (operatorStack.IsOnTop("+") || operatorStack.IsOnTop("-"))
                {
                    valueStack.Push(Calculate(valueStack.Pop(), operatorStack.Pop(), valueStack.Pop()));
                }
                operatorStack.Pop();
                if (operatorStack.IsOnTop("*") || operatorStack.IsOnTop("/"))
                {
                    if (operatorStack.IsOnTop("/") && valueStack.Peek() == 0.0)
                        return new FormulaError("cannot divide by zero");

                    valueStack.Push(Calculate(valueStack.Pop(), operatorStack.Pop(), valueStack.Pop()));
                }
                continue;
            }
        }

        if (operatorStack.Count == 0 && valueStack.Count == 1)
        {
            return valueStack.Pop();

        }
        else 
        {

            return Calculate(valueStack.Pop(), operatorStack.Pop(), valueStack.Pop());
        }
    }
    /// <summary>
    /// private Helper to calculate the result of two doubles
    /// </summary>
    /// <param name="double1"></param>
    /// <param name="op"></param>
    /// <param name="double2"></param>
    /// <returns></returns>
    /// <exception cref="ArgumentException"></exception>
    private static double Calculate(double double1, string op, double double2)
    {
        if (op == "*")
            return double1 * double2;
        else if (op == "/")
        { 
            return double1 / double2;
        }
            
        else if (op == "-")
            return double2 - double1;
        else
            return double1 + double2;
    }
    

    /// <summary>
    /// Enumerates the normalized versions of all of the variables that occur in this
    /// formula.  No normalization may appear more than once in the enumeration, even
    /// if it appears more than once in this Formula.
    ///
    /// For example, if N is a method that converts all the letters in a string to upper case:
    ///
    /// new Formula("x+y*z", N, s => true).GetVariables() should enumerate "X", "Y", and "Z"
    /// new Formula("x+X*z", N, s => true).GetVariables() should enumerate "X" and "Z".
    /// new Formula("x+X*z").GetVariables() should enumerate "x", "X", and "z".
    /// </summary>
    public IEnumerable<string> GetVariables()
    {
        List<string> returnList = new List<string>();
        int size = tokenList.Count;
        List<string> copy = tokenList;

        //normalize all variables
        for (int i = 0; i < size; i++)
        {
            if (IsVar(copy[i]))
                copy[i] = normalizeFunc(copy[i]);
        }

        for (int i = 0; i < size;i++)
        {
            if (IsVar(copy[i]) && !returnList.Contains(copy[i]))
            {
                returnList.Add(copy[i]);
            }
        }
        return returnList;
    }

    /// <summary>
    /// Returns a string containing no spaces which, if passed to the Formula
    /// constructor, will produce a Formula f such that this.Equals(f).  All of the
    /// variables in the string should be normalized.
    ///
    /// For example, if N is a method that converts all the letters in a string to upper case:
    ///
    /// new Formula("x + y", N, s => true).ToString() should return "X+Y"
    /// new Formula("x + Y").ToString() should return "x+Y"
    /// </summary>
    public override string ToString()
    {
        int size = tokenList.Count;
        List<string> copy = tokenList;
        string returnString = "";
        for (int i = 0; i < size; i++)
        {
            if (IsVar(tokenList[i]))
            {
                copy[i] = normalizeFunc(tokenList[i]);
            }
        }
        foreach (string s in copy)
        {
            returnString += s;
        }
        return returnString;
    }

    /// <summary>
    /// If obj is null or obj is not a Formula, returns false.  Otherwise, reports
    /// whether or not this Formula and obj are equal.
    ///
    /// Two Formulae are considered equal if they consist of the same tokens in the
    /// same order.  To determine token equality, all tokens are compared as strings
    /// except for numeric tokens and variable tokens.
    /// Numeric tokens are considered equal if they are equal after being "normalized" by
    /// using C#'s standard conversion from string to double (and optionally back to a string).
    /// Variable tokens are considered equal if their normalized forms are equal, as
    /// defined by the provided normalizer.
    ///
    /// For example, if N is a method that converts all the letters in a string to upper case:
    ///
    /// new Formula("x1+y2", N, s => true).Equals(new Formula("X1  +  Y2")) is true
    /// new Formula("x1+y2").Equals(new Formula("X1+Y2")) is false
    /// new Formula("x1+y2").Equals(new Formula("y2+x1")) is false
    /// new Formula("2.0 + x7").Equals(new Formula("2.000 + x7")) is true
    /// </summary>
    public override bool Equals(object? obj)
    {
        if(obj == null)
            return false;

        Formula? paramFormula = obj as Formula;
        Formula nonNullFormula;

        if (paramFormula is null)// if paramFormula is null then it is not a Formula
            return false;
        else
        {
            nonNullFormula = paramFormula;
        }

        return this == nonNullFormula;
    }

    /// <summary>
    /// Reports whether f1 == f2, using the notion of equality from the Equals method.
    /// Note that f1 and f2 cannot be null, because their types are non-nullable
    /// </summary>
    public static bool operator ==(Formula f1, Formula f2)
    {
        List<string> f1List = f1.tokenList;
        List<string> f2List = f2.tokenList;

        int size = 0;
        double f1Result;
        double f2Result;

        if (f1List.Count != f2List.Count)
            return false;
        else
            size = f1List.Count;

        for (int i = 0; i < size; i++)
        {
            f1List[i] = normalizeFunc(f1List[i]);
            f2List[i] = normalizeFunc(f2List[i]);
        }

        for (int i = 0; i < size; i++)
        {
            if (f1.IsVar(f1List[i]) && f2.IsVar(f2List[i]))
            {
                
                if (f1List[i] != f2List[i])
                    return false;
                    
            }
            else if (double.TryParse(f1List[i], out f1Result) && double.TryParse(f1List[i], out f2Result))
            {
                if (f1Result != f2Result)
                    return false;
            }
            else if (f1List[i] != f2List[i])
                return false;
        }
        return true;
    }

    /// <summary>
    /// Reports whether f1 != f2, using the notion of equality from the Equals method.
    /// Note that f1 and f2 cannot be null, because their types are non-nullable
    /// </summary>
    public static bool operator !=(Formula f1, Formula f2)
    {
        if (f1 == f2)
            return false;
        return true;
    }

    /// <summary>
    /// Returns a hash code for this Formula.  If f1.Equals(f2), then it must be the
    /// case that f1.GetHashCode() == f2.GetHashCode().  Ideally, the probability that two
    /// randomly-generated unequal Formulae have the same hash code should be extremely small.
    /// </summary>
    public override int GetHashCode()
    {
        int code = 0;
        foreach (string token in tokenList)
        {
            code += token.GetHashCode();
        }
        return code;
    }

    /// <summary>
    /// Given an expression, enumerates the tokens that compose it.  Tokens are left paren;
    /// right paren; one of the four operator symbols; a legal variable token;
    /// a double literal; and anything that doesn't match one of those patterns.
    /// There are no empty tokens, and no token contains white space.
    /// </summary>
    private static IEnumerable<string> GetTokens(string formula)
    {
        // Patterns for individual tokens
        string lpPattern = @"\(";
        string rpPattern = @"\)";
        string opPattern = @"[\+\-*/]";
        string varPattern = @"[a-zA-Z_](?: [a-zA-Z_]|\d)*";
        string doublePattern = @"(?: \d+\.\d* | \d*\.\d+ | \d+ ) (?: [eE][\+-]?\d+)?";
        string spacePattern = @"\s+";

        // Overall pattern
        string pattern = string.Format("({0}) | ({1}) | ({2}) | ({3}) | ({4}) | ({5})",
                                        lpPattern, rpPattern, opPattern, varPattern, doublePattern, spacePattern);

        // Enumerate matching tokens that don't consist solely of white space.
        foreach (string s in Regex.Split(formula, pattern, RegexOptions.IgnorePatternWhitespace))
        {
            if (!Regex.IsMatch(s, @"^\s*$", RegexOptions.Singleline))
            {
                yield return s;
            }
        }

    }
}
/// <summary>
/// Helper extension method for Evaluate's stacks
/// </summary>
public static class ExtensionClass
{
    public static bool IsOnTop(this Stack<string> stack, string c)
    {
        return stack.Count > 0 && stack.Peek() == c;
    }
}
/// <summary>
/// Used to report syntactic errors in the argument to the Formula constructor.
/// </summary>
public class FormulaFormatException : Exception
{
    /// <summary>
    /// Constructs a FormulaFormatException containing the explanatory message.
    /// </summary>
    public FormulaFormatException(string message) : base(message)
    {
    }
}

/// <summary>
/// Used as a possible return value of the Formula.Evaluate method.
/// </summary>
public struct FormulaError
{
    /// <summary>
    /// Constructs a FormulaError containing the explanatory reason.
    /// </summary>
    /// <param name="reason"></param>
    public FormulaError(string reason) : this()
    {
        Reason = reason;
    }

    /// <summary>
    ///  The reason why this FormulaError was created.
    /// </summary>
    public string Reason { get; private set; }
}
