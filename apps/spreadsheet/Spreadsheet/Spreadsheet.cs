using System;
using System.Collections.Generic;
using System.Linq;
using System.Runtime.CompilerServices;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using SpreadsheetUtilities;
using static System.Runtime.InteropServices.JavaScript.JSType;
using System.Text.Json;
using System.Collections.Immutable;
using System.Text.Json.Serialization;
using System.IO;
using System.Text.Json.Nodes;
using static SS.Spreadsheet;

namespace SS;
/// <summary>
/// This class implements Abstract Spreadsheet and uses method from Formula 
/// DependencyGraph. It contains a backing datastructure containing a dictionary 
/// of all cells which are not empty. An empty cell contains a "" by default.
/// It contains a dependency graph dg to represent the relationships between cells.
/// </summary>
public class Spreadsheet : AbstractSpreadsheet
{
    //fields
    [JsonInclude]
    public Dictionary<string, Cell> dict;
    private DependencyGraph dg;


    public Func<string, bool> IsValid
    {
        get; protected set;
    }
    public Func<string, string> Normalize
    {
        get; protected set;
    }
    public IDictionary<string, Cell> Cells { get
        {
            return dict.ToImmutableDictionary();
        } 
    }
    [JsonConstructor]
    public Spreadsheet(Dictionary<string, Cell> cells, string version) : base(version)
    {
        this.dict = cells;
        this.dg = new DependencyGraph();//TODO
        this.IsValid = s => true;
        this.Normalize = s => s;
        this.Changed = false;
    }
    /// <summary>
    /// Default Constructor
    /// </summary>
    public Spreadsheet() :
        this(s => true, s => s, "default")

    {
    }
    /// <summary>
    /// three-argument constructor which creates an empty spreadsheet and allows 
    /// the user to provide a validity delegate, norm delegate, and version
    /// </summary>
    public Spreadsheet(Func<string, bool> isValid, Func<string, string> normalize, string version) : base(version)
    {
        this.IsValid = isValid;
        this.Normalize = normalize;
        dg = new DependencyGraph();
        dict = new Dictionary<string, Cell>();
    }
    /// <summary>
    /// 4-argument constructor. 1st param is string path to a file. The other arguments are the
    /// same as the 3-argument constructor.
    /// </summary>
    public Spreadsheet(string path, Func<string, bool> isValid, Func<string, string> normalize, string version) : base(version)
    {
        string jsonString = File.ReadAllText(path);
        Console.WriteLine(jsonString);

        Spreadsheet? ss = (Spreadsheet?)JsonSerializer.Deserialize<Spreadsheet>(jsonString, new JsonSerializerOptions()
        {
            PropertyNameCaseInsensitive = true,
        });
        if (ss != null)
        {
            this.dict = ss.dict;
        }
        else
        {
            this.dict = new Dictionary<string, Cell>();
        }
        this.dg = new DependencyGraph();//TODO
        this.IsValid = isValid;
        this.Normalize = normalize;
        this.Changed = false;

    }

    public override void Save(string filename)
    {
        JsonSerializerOptions jso = new();
        jso.WriteIndented = true;
        string jsonString = JsonSerializer.Serialize(this, jso);

        string pathName = "C:\\Users\\roscoe\\source\\repos\\spreadsheet-JRoscoeM\\Spreadsheet" + "\\" + filename;
        File.WriteAllText(pathName, jsonString);
    }
    public override IList<string> SetContentsOfCell(string name, string content)
    {
        name = Normalize(name);
        this.Changed = true;

        if (!IsValidName(name) || IsValid(name) != true)
            throw new InvalidNameException();

        
        bool isFormula = true;
        try
        {
            Formula f = new Formula(content);
        }catch (FormulaFormatException)
        {
            isFormula = false;
        }

        if (double.TryParse(content, out double doubleValue))
        {
            List<string> returnList = SetCellContents(name, doubleValue).ToList();
            foreach (string cellName in returnList)
            {
                //dict[cellName].SetCellValue()
                if(dict.ContainsKey(cellName) && dict[cellName].GetCellContents().GetType() == typeof(Formula))
                {
                    Formula f = (Formula)dict[cellName].GetCellContents();
                    dict[cellName].SetCellValue(f.Evaluate(Lookup));
                }

            }
            return returnList;
        }
        else if (isFormula)
        {
            Formula formula = new Formula(content, this.Normalize, this.IsValid);
            if (CircularDependencyExists(formula, name))
            {
                throw new CircularException();
            }
            else
            {
                List<string> returnList = SetCellContents(name, formula).ToList();
                foreach (string cellName in returnList)
                {
                    if (dict.ContainsKey(cellName) && dict[cellName].GetCellContents().GetType() == typeof(Formula))
                    {
                        Formula f = (Formula)dict[cellName].GetCellContents();
                        dict[cellName].SetCellValue(f.Evaluate(Lookup));
                    }
                }
                return returnList;

            }
        }
        else
        {

            List<string> returnList = SetCellContents(name, content).ToList();
            foreach (string cellName in returnList)
            {
                if (dict.ContainsKey(cellName) && dict[cellName].GetCellContents().GetType() == typeof(Formula))
                {
                    Formula f = (Formula)dict[cellName].GetCellContents();
                    dict[cellName].SetCellValue(f.Evaluate(Lookup));
                }
                if (dict.ContainsKey(cellName) && dict[cellName].GetCellContents().GetType() == typeof(string))
                {
                    dict[cellName].SetCellValue(content);
                }
            }
            return returnList;
        }

    }
    public override object GetCellValue(string name)
    {
        dict.TryGetValue(name, out Cell? cell);
        if (cell != null)
            return cell.GetCellValue();
        else
            return "";
    }
    public override object GetCellContents(string name)
    {
        string normalizedName = Normalize(name);
        if (!IsValidName(normalizedName))
            throw new InvalidNameException();
        Cell? cell;
        dict.TryGetValue(normalizedName, out cell);
        if (cell == null)
            return "";
        return cell.GetCellContents();
    }

    public override IEnumerable<string> GetNamesOfAllNonemptyCells()
    {
        foreach (KeyValuePair<string, Cell> pair in dict)
        {
            if (pair.Value.GetCellContents() is string && (string)pair.Value.GetCellContents() != "")
                yield return pair.Key;
            if (!(pair.Value.GetCellContents() is string))
                yield return pair.Key;
        }
    }

    protected override IList<string> SetCellContents(string name, double number)
    {
        Cell cell = new Cell(name, number, Lookup);
        if(dict.ContainsKey(name))
        {
            dict[name] = cell;
        }
        else
        {
            dict.Add(name, cell);
        }
        dg.ReplaceDependees(name, new HashSet<string>());

        List<string> dgDependees = new List<string>(GetCellsToRecalculate(name));
        return dgDependees;

        //if (dict.ContainsKey(name))
        //{
        //    Cell? cell;
        //    dict.TryGetValue(name, out cell);
        //    if (cell != null)
        //    {
        //        if (cell.GetCellContents() is Formula)//if you are replacing a formula then you need to update the dependencies
        //        {
        //            Formula f = (Formula)cell.GetCellContents();
        //            foreach (string varString in f.GetVariables())
        //            {
        //                dg.RemoveDependency(name, varString);
        //            }

        //        }
        //        cell.SetCellContents(number, Lookup);
        //    }

        //    if (cell == null) //this shouldn't ever happen
        //    {
        //        throw new NullReferenceException();
        //    }
        //}
        //else if (!dict.ContainsKey(name))
        //{
        //    dict.Add(name, new Cell(name, number, Lookup));
        //}
        ////dg.ReplaceDependees(name, new HashSet<string>());

        //IList<string> dependOnName = GetCellsToRecalculate(name).ToList();
        //return dependOnName;
    }

    protected override IList<string> SetCellContents(string name, string text)
    {
        Cell cell = new Cell(name, text, Lookup);
        if (dict.ContainsKey(name))
        {
            dict[name] = cell;
            //Cell? cell;
            //dict.TryGetValue(name, out cell);
            //if (cell != null)
            //{
            //    if (cell.GetCellContents() is Formula)//if you are replacing a formula then you need to update the dependencies
            //    {
            //        Formula f = (Formula)cell.GetCellContents();
            //        foreach (string varString in f.GetVariables())
            //        {
            //            dg.RemoveDependency(name, varString);
            //        }

            //    }
            //    cell.SetCellContents(text, Lookup);
            //}

            //if (cell == null)
            //{
            //    throw new NullReferenceException();// this shouldn't ever happen
            //}
        }
        else if (!dict.ContainsKey(name))
        {
            dict.Add(name, new Cell(name, text, Lookup));
        }
        dg.ReplaceDependees(name, new HashSet<string>());
        IList<string> dependOnName = GetCellsToRecalculate(name).ToList();

        return dependOnName;
    }

    protected override IList<string> SetCellContents(string name, Formula formula)
    {
        IEnumerable<string> previousDependees = dg.GetDependees(name);
        dg.ReplaceDependees(name, formula.GetVariables());
        try
        {
            List<string> dependees = new List<string>(GetCellsToRecalculate(name));
            Cell formulaCell = new Cell(name, formula, Lookup);
            if(dict.ContainsKey(name))
            {
                dict[name] = formulaCell;
            }
            else
            {
                dict.Add(name, formulaCell);
            }
            return dependees.ToList<string>();
        }
        catch(CircularException)
        {
            dg.ReplaceDependees(name, previousDependees);
            throw new CircularException();
        }
    }

    protected override IEnumerable<string> GetDirectDependents(string name)
    {
        if(!IsValidName(name))
        {
            throw new InvalidNameException();
        }
        return dg.GetDependents(name);
    }
    /// <summary>
    /// private helper method to determine if the given name is a valid name
    /// </summary>
    private bool IsValidName(string name)
    {
        string varPattern = "^[a-zA-z_][a-zA-Z0-9_]*$";

        if (Regex.IsMatch(name, varPattern))
        {
            return true;
        }

        return false;
    }
    private double Lookup(string name)
    {

        dict.TryGetValue(name, out Cell? cell);
        
        if (cell != null && cell.GetCellValue() is Formula)
        {
            return Lookup(cell.name);
        }
        if (cell != null && cell.GetCellValue() is double)
        {
            return (double)cell.GetCellValue();
        }
        else
        {
            throw new Exception();
        }
            
    }
    /// <summary>
    /// Private helper to determine if a circular dependency exists.
    /// </summary>
    /// <param name="formula"></param>
    /// <param name="name"></param>
    /// <returns></returns>
    private bool CircularDependencyExists(Formula formula, string name)
    {

        List<string> variables = (List<string>)formula.GetVariables();
        if (dg.HasDependents(name))
        {
            foreach (string dependent in dg.GetDependents(name))
            {
                return CircularDependencyExists(formula, dependent);
            }
        }
        return false;
    }

    /// <summary>
    /// private nested class to represent a cell.
    /// contains get and set methods for contents and 
    /// a default constructor if there are no contents
    /// </summary>
    public class Cell
    {
        public string name;
        public object contents;
        public object value;
        public string? StringForm;

        Func<string, double>? lookupFunc;
        [JsonConstructor]
        public Cell(string StringForm)
        {
            this.lookupFunc = s => 1;
            double result;
            bool isFormula = true;
            Formula f;
            try
            {
                f = new Formula(StringForm);
            }
            catch (FormulaFormatException)
            {
                isFormula = false;
            }

            if (Double.TryParse(StringForm, out result))
            {
                contents = result;
                value = result;
                //dict.Add(result);

            }
            else if (isFormula)
            {

                Formula func = new Formula(StringForm);
                contents = func;

                value = Cache(func, lookupFunc);
            }
            else
            {
                contents = StringForm;
                value = StringForm;
            }

            name = "";
            this.StringForm = StringForm;
        }
        /// <summary>
        /// Constructor which sets all the fields and evaluates the value based on typeof content
        /// </summary>
        /// <param name="name"></param>
        /// <param name="contents"></param>
        /// <param name="lookupFunc"></param>
        /// <exception cref="Exception"></exception>
        public Cell(string name, object contents, Func<string, double> lookupFunc)
        {
            this.name = name;
            this.contents = contents;

            if (contents is double)
            {
                value = (double)contents;
                if (contents != null)
                {
                    StringForm = ((double)contents).ToString();
                }
            }
            else if (contents is string)
            {
                value = (string)contents;
                StringForm = (string)contents;
            }
            else if (contents is Formula formula)
            {
                value = Cache(formula, lookupFunc);
                StringForm = formula.ToString();
            }
            else
            {
                throw new Exception();
            }
        }
        /// <summary>
        /// private helper to cache
        /// </summary>
        /// <param name="formula"></param>
        private object Cache(Formula formula, Func<string, double> Lookup)
        {
            try
            {
                return formula.Evaluate(Lookup);
            }
            catch (Exception)
            {
                return new FormulaError();
            }
        }

        public object GetCellContents()
        {
            return contents;
        }
        public void SetCellContents(object newContents, Func<string, double> lookupFunc)
        {
            contents = newContents;
            if (contents is Formula formula)
            {
                Cache(formula,lookupFunc);
            }
        }
        public object GetCellValue()
        {
            return value;
        }
        public void SetCellValue(object newValue)
        {
            value = newValue;
        }
    }
}
