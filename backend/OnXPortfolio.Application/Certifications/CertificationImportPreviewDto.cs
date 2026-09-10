namespace OnXPortfolio.Application.Certifications;

public sealed class CertificationImportPreviewDto
{
    public int TotalRows { get; set; }

    public int ValidRows { get; set; }

    public int ErrorRows { get; set; }

    public int NewRecords { get; set; }

    public int Updates { get; set; }

    public int Archives { get; set; }

    public List<CertificationImportPreviewRowDto> Rows { get; set; } = [];
}

public sealed class CertificationImportPreviewRowDto
{
    public int RowNumber { get; set; }

    public string Action { get; set; } = string.Empty;

    public Guid? CertificationId { get; set; }

    public string PersonName { get; set; } = string.Empty;

    public string? PersonEmail { get; set; }

    public string VendorName { get; set; } = string.Empty;

    public string CertificationName { get; set; } = string.Empty;

    public string Status { get; set; } = string.Empty;

    public DateOnly? DateCompleted { get; set; }

    public DateOnly? ExpiryDate { get; set; }

    public string? PracticeLead { get; set; }

    public string? RebateImpact { get; set; }

    public string? Notes { get; set; }

    public bool IsValid { get; set; }

    public List<string> Errors { get; set; } = [];

    public List<string> Warnings { get; set; } = [];
}